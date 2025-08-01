import json
from datetime import datetime
import logging
from typing import List
from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.http import require_GET, require_POST
from django.utils import timezone


from wordwalls.models import (
    DailyChallengeName,
    DailyChallenge,
    DailyChallengeLeaderboardEntry,
    NamedList,
)
from base.models import Lexicon, WordList
from base.forms import SavedListForm
from lib.response import response, bad_request
from lib.wdb_interface.word_searches import (
    SearchDescription,
    MIN_MAX_DESCRIPTIONS,
    SINGLE_NUMBER_DESCRIPTIONS,
    SINGLE_STRING_DESCRIPTIONS,
    TAGS_DESCRIPTION,
    HOOKS_DESCRIPTIONS,
    SearchCriterionFn,
)
from wordwalls.views import (
    get_leaderboard_data,
    get_leaderboard_data_for_dc_instance,
)
from wordwalls.challenges import toughies_challenge_date
from wordwalls.game import WordwallsGame, GameInitException
from wordwalls.stats_service import StatsService
import rpc.wordsearcher.searcher_pb2 as pb

# from wordwalls.socket_consumers import LOBBY_CHANNEL_NAME, table_info

logger = logging.getLogger(__name__)
strptime = datetime.strptime


def configure(request):
    if request.method != "POST":
        return bad_request("Must use POST.")
    # XXX: User can put any old JSON here. We should do some backend
    # validation.
    prefs = json.loads(request.body)

    profile = request.user.aerolithprofile
    profile.customWordwallsStyle = json.dumps(prefs)
    profile.save()
    return response("OK")


# API Views. No Auth required.
def api_challengers(request):
    if request.method != "GET":
        return bad_request("Must use GET.")
    lex = request.GET.get("lexicon")
    ch_id = request.GET.get("challenge")
    ch_date = date_from_request_dict(request.GET)
    tiebreaker = request.GET.get("tiebreaker", "errors")

    # Validate lexicon ID is an integer
    try:
        lex_id = int(lex)
    except (ValueError, TypeError):
        return bad_request("Invalid lexicon ID. Must be a valid integer.")

    try:
        lex = Lexicon.objects.get(pk=lex_id)
        ch_name = DailyChallengeName.objects.get(pk=ch_id)
    except (ObjectDoesNotExist, ValueError, TypeError):
        return bad_request("Bad lexicon or challenge.")

    return response(get_leaderboard_data(lex, ch_name, ch_date, tiebreaker))


def api_challengers_by_tablenum(request):
    if request.method != "GET":
        return bad_request("Must use GET.")
    tablenum = request.GET.get("tablenum")
    tiebreaker = request.GET.get("tiebreaker", "errors")
    wwg = WordwallsGame()
    dc_id = wwg.get_dc_id(tablenum)
    if dc_id > 0:
        dc = DailyChallenge.objects.get(pk=dc_id)
        leaderboard_data = get_leaderboard_data_for_dc_instance(dc, tiebreaker)
        return response(leaderboard_data)
    return bad_request("No such daily challenge.")


def api_answers(request):
    if request.method != "GET":
        return bad_request("Must use GET.")
    tablenum = request.GET.get("tablenum")
    wwg = WordwallsGame()
    answer_list = wwg.answer_list(tablenum)
    if answer_list:
        return response(answer_list)

    return bad_request("Could not fetch answer list")


# Other API views with required auth.
@login_required
@require_GET
def challenges_played(request):
    """Get the challenges for the given day, played by the logged-in user."""

    lex = request.GET.get("lexicon")
    ch_date = date_from_request_dict(request.GET)

    # Validate lexicon ID is an integer
    try:
        lex_id = int(lex)
    except (ValueError, TypeError):
        return bad_request("Invalid lexicon ID. Must be a valid integer.")

    try:
        lex = Lexicon.objects.get(pk=lex_id)
    except Lexicon.DoesNotExist:
        return bad_request("Bad lexicon.")

    challenges = DailyChallenge.objects.filter(date=ch_date, lexicon=lex)
    entries = DailyChallengeLeaderboardEntry.objects.filter(
        board__challenge__in=challenges, user=request.user
    )

    resp = []
    for entry in entries:
        resp.append({"challengeID": entry.board.challenge.name.pk})
    # Search for toughies challenge as well.
    toughies_date = toughies_challenge_date(ch_date)
    try:
        relevant_toughie = DailyChallenge.objects.get(
            date=toughies_date,
            lexicon=lex,
            name__name=DailyChallengeName.WEEKS_BINGO_TOUGHIES,
        )
    except DailyChallenge.DoesNotExist:
        return response(resp)
    # If the toughies date is not the date in question, we need to see if
    # the user has an entry for this challenge.
    if toughies_date != ch_date:
        try:
            entry = DailyChallengeLeaderboardEntry.objects.get(
                board__challenge=relevant_toughie, user=request.user
            )
        except DailyChallengeLeaderboardEntry.DoesNotExist:
            return response(resp)
        resp.append({"challengeID": entry.board.challenge.name.pk})

    return response(resp)


@login_required
@require_GET
def special_challenges(request):
    lex = request.GET.get("lexicon")
    ch_date = date_from_request_dict(request.GET)

    # Validate lexicon ID is an integer
    try:
        lex_id = int(lex)
    except (ValueError, TypeError):
        return bad_request("Invalid lexicon ID. Must be a valid integer.")

    try:
        lex = Lexicon.objects.get(pk=lex_id)
    except Lexicon.DoesNotExist:
        return bad_request("Bad lexicon.")

    challenges = DailyChallenge.objects.filter(
        date=ch_date,
        lexicon=lex,
        name__orderPriority=DailyChallengeName.SPECIAL_CHALLENGE_ORDER_PRIORITY,
    ).order_by(  # noqa
        "id"
    )

    resp = []
    for challenge in challenges:
        resp.append(
            {
                "id": challenge.name.id,
                "seconds": challenge.seconds,
                "numQuestions": len(json.loads(challenge.alphagrams)),
                "name": challenge.visible_name,
                "orderPriority": challenge.name.orderPriority,
            }
        )

    return response(resp)


def load_new_words(f):
    @wraps(f)
    def wrap(request, *args, **kwargs):
        """A decorator for all the functions that load new words."""
        try:
            body = json.loads(request.body)
        except (TypeError, ValueError):
            return bad_request("Badly formatted body.")
        # First verify that the user has access to this table.
        if not access_to_table(body["tablenum"], request.user):
            return bad_request("User is not in this table.")

        parsed_req = {
            # If tablenum is None, the utility functions in game.py know
            # to create a new table, instead of using an existing table
            # number.
            "tablenum": body["tablenum"] if body["tablenum"] != 0 else None
        }

        lex_id = body.get("lexicon")

        # Validate lexicon ID is an integer
        try:
            lex_id = int(lex_id)
        except (ValueError, TypeError):
            return bad_request("Invalid lexicon ID. Must be a valid integer.")

        try:
            lexicon = Lexicon.objects.get(pk=lex_id)
        except Lexicon.DoesNotExist:
            return bad_request("Bad lexicon.")
        parsed_req["lexicon"] = lexicon
        parsed_req["challenge"] = body.get("challenge")
        parsed_req["dt"] = body.get("date")

        if "desiredTime" in body:
            quiz_time_secs = int(round(body["desiredTime"] * 60))
            if quiz_time_secs < 1 or quiz_time_secs > 3600:
                return bad_request(
                    "Desired time must be between 1 and 3600 " "seconds."
                )
            parsed_req["quiz_time_secs"] = quiz_time_secs

        parsed_req["questions_per_round"] = body.get("questionsPerRound", 50)
        if (
            parsed_req["questions_per_round"] > 200
            or parsed_req["questions_per_round"] < 10
        ):
            return bad_request("Questions per round must be between 10 and 200.")
        parsed_req["search_criteria"] = body.get("searchCriteria", [])
        parsed_req["list_option"] = body.get("listOption")
        parsed_req["selectedList"] = body.get("selectedList")
        parsed_req["multiplayer"] = body.get("multiplayer", False)
        parsed_req["raw_questions"] = body.get("rawQuestions", False)
        return f(request, parsed_req, *args, **kwargs)

    return wrap


def table_response(tablenum):
    game = WordwallsGame()
    addl_params = game.get_add_params(tablenum)
    wgm = game.get_wgm(tablenum, lock=False)

    # Sometimes, 'tempListName' will not be in addl_params, when this
    # is loading an already existing saved list. Instead, get from saveName.
    if addl_params.get("saveName"):
        autosave = True
        list_name = addl_params["saveName"]
    else:
        autosave = False
        list_name = addl_params["tempListName"]
    return response(
        {
            "tablenum": tablenum,
            "list_name": list_name,
            "lexicon": wgm.lexicon.lexiconName,
            "autosave": autosave,
            "multiplayer": addl_params.get("multiplayer", False),
        }
    )


@login_required
@require_POST
@load_new_words
def new_challenge(request, parsed_req_body):
    """
    Load a new challenge into this table.

    """
    try:
        challenge_name = DailyChallengeName.objects.get(pk=parsed_req_body["challenge"])
    except DailyChallengeName.DoesNotExist:
        return bad_request("Bad challenge.")
    try:
        tablenum = WordwallsGame().initialize_daily_challenge(
            request.user,
            parsed_req_body["lexicon"],
            challenge_name,
            date_from_str(parsed_req_body["dt"]),
            use_table=parsed_req_body["tablenum"],
        )
    except GameInitException as e:
        return bad_request(str(e))
    return table_response(tablenum)


def build_search_criteria(
    user, lexicon, fe_search_criteria
) -> List[pb.SearchRequest.SearchParam]:
    search = [
        SearchDescription.lexicon(lexicon),
    ]
    hold_until_end = None
    for criterion in fe_search_criteria:
        try:
            criterion_fn = SearchCriterionFn(criterion["searchType"])
        except AttributeError:
            raise GameInitException(
                f'Cannot handle search type {criterion["searchType"]}'
            )

        if criterion["searchType"] in MIN_MAX_DESCRIPTIONS:
            search.append(
                criterion_fn(int(criterion["minValue"]), int(criterion["maxValue"]))
            )

        elif criterion["searchType"] in SINGLE_NUMBER_DESCRIPTIONS:
            search.append(criterion_fn(criterion["value"]))

        elif criterion["searchType"] == TAGS_DESCRIPTION:
            tags = criterion["value"].split(",")
            new_tags = []
            for t in tags:
                stripped = t.strip()
                if stripped != "":
                    new_tags.append(stripped)

            if hold_until_end:
                raise GameInitException("You can only specify one set of tags")
            hold_until_end = criterion_fn(new_tags, user, lexicon)
        elif criterion["searchType"] in SINGLE_STRING_DESCRIPTIONS:
            search.append(criterion_fn(criterion["value"].strip()))
        elif criterion["searchType"] in HOOKS_DESCRIPTIONS:
            search.append(
                criterion_fn(
                    criterion["hookType"],
                    criterion["hooks"].strip(),
                    criterion.get("notCondition", False),
                )
            )
        else:
            # No value, this criterion must not be associated with a specific
            # filter value.
            search.append(criterion_fn())

    if hold_until_end:
        search.append(hold_until_end)
    return search


@login_required
@require_POST
@load_new_words
def new_search(request, parsed_req_body):
    """
    Load a new search into this table.

    """
    try:
        search = build_search_criteria(
            request.user,
            parsed_req_body["lexicon"],
            parsed_req_body["search_criteria"],
        )

        tablenum = WordwallsGame().initialize_by_search_params(
            request.user,
            search,
            parsed_req_body["quiz_time_secs"],
            parsed_req_body["questions_per_round"],
            use_table=parsed_req_body["tablenum"],
            multiplayer=parsed_req_body["multiplayer"],
        )
    except GameInitException as e:
        return bad_request(str(e))

    return table_response(tablenum)


@login_required
@require_POST
@load_new_words
def load_aerolith_list(request, parsed_req_body):
    """Load an Aerolith list (a pre-defined list) into this table."""

    try:
        named_list = NamedList.objects.get(pk=parsed_req_body["selectedList"])
    except NamedList.DoesNotExist:
        return bad_request("List does not exist.")
    except (TypeError, ValueError):
        return bad_request("Please select a list.")
    tablenum = WordwallsGame().initialize_by_named_list(
        parsed_req_body["lexicon"],
        request.user,
        named_list,
        parsed_req_body["quiz_time_secs"],
        parsed_req_body["questions_per_round"],
        use_table=parsed_req_body["tablenum"],
        multiplayer=parsed_req_body["multiplayer"],
    )
    return table_response(tablenum)


@login_required
@require_POST
@load_new_words
def load_saved_list(request, parsed_req_body):
    """Load a user Saved List into this table."""

    try:
        saved_list = WordList.objects.get(
            user=request.user, pk=parsed_req_body["selectedList"]
        )
    except WordList.DoesNotExist:
        return bad_request("List does not exist.")
    try:
        tablenum = WordwallsGame().initialize_by_saved_list(
            parsed_req_body["lexicon"],
            request.user,
            saved_list,
            convert_to_form_option(parsed_req_body["list_option"]),
            parsed_req_body["quiz_time_secs"],
            parsed_req_body["questions_per_round"],
            use_table=parsed_req_body["tablenum"],
            multiplayer=parsed_req_body["multiplayer"],
        )
    except GameInitException as e:
        return bad_request(str(e))
    return table_response(tablenum)


@login_required
@require_POST
@load_new_words
def load_raw_questions(request, parsed_req_body):
    try:
        tablenum = WordwallsGame().initialize_by_raw_questions(
            parsed_req_body["lexicon"],
            request.user,
            parsed_req_body["raw_questions"],
            parsed_req_body["quiz_time_secs"],
            parsed_req_body["questions_per_round"],
            use_table=parsed_req_body["tablenum"],
            multiplayer=parsed_req_body["multiplayer"],
        )
    except GameInitException as e:
        return bad_request(str(e))
    return table_response(tablenum)


@login_required
@require_GET
def default_lists(request):
    lex_id = request.GET.get("lexicon")

    # Validate lexicon ID is an integer
    try:
        lex_id = int(lex_id)
    except (ValueError, TypeError):
        return bad_request("Invalid lexicon ID. Must be a valid integer.")

    try:
        lex = Lexicon.objects.get(pk=lex_id)
    except Lexicon.DoesNotExist:
        return bad_request("Bad lexicon.")

    ret_data = []
    for nl in NamedList.objects.filter(lexicon=lex).order_by("id"):
        ret_data.append(
            {
                "name": nl.name,
                "lexicon": nl.lexicon.lexiconName,
                "numAlphas": nl.numQuestions,
                "wordLength": nl.wordLength,
                "id": nl.pk,
            }
        )
    return response(ret_data)


# @login_required
# @require_GET
# def tables(request):
#     rooms = Room.objects.exclude(channel_name=LOBBY_CHANNEL_NAME)
#     ret_tables = []
#     for room in rooms:
#         try:
#             ret_tables.append(
#                 WordwallsGameModel.objects.get(pk=room.channel_name))
#         except WordwallsGameModel.DoesNotExist:
#             pass

#     return response({
#         'tables': [table_info(table) for table in ret_tables]
#     })


# api views helpers


def convert_to_form_option(list_option):
    """
    Convert the list option, which is a string, to a numeric form
    option as defined in SavedListForm.

    """
    try:
        return {
            "firstmissed": SavedListForm.FIRST_MISSED_CHOICE,
            "continue": SavedListForm.CONTINUE_LIST_CHOICE,
            "startover": SavedListForm.RESTART_LIST_CHOICE,
        }[list_option]
    except KeyError:
        return None


def access_to_table(tablenum, user):
    """Return whether user has access to table. For now we just use
    the wordwalls game model. We should fix the logic for multiplayer
    afterwards."""
    if tablenum == 0:
        # A table num of 0 implies that the user is not currently in a
        # table. Return true to allow the logic to proceed.
        return True
    game = WordwallsGame()
    return game.allow_access(user, tablenum)


def date_from_request_dict(request_dict):
    """Get the date from the given request dictionary."""
    # YYYY-mm-dd
    dt = request_dict.get("date")
    return date_from_str(dt)


def date_from_str(dt):
    """
    Return a date given a string in YYYY-MM-DD format, that is no bigger
    than today.

    """

    today = timezone.localtime(timezone.now()).date()
    try:
        ch_date = strptime(dt, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        ch_date = today

    if ch_date > today:
        ch_date = today

    return ch_date


# Statistics API endpoints
@require_GET
def api_stats_today(request):
    """Get today's statistics."""
    try:
        stats = StatsService.get_today_stats()
        return response(stats)
    except Exception as e:
        logger.exception("Error getting today stats")
        return bad_request(f"Error retrieving statistics: {str(e)}")


@require_GET
def api_stats_week(request):
    """Get last 7 days statistics."""
    try:
        stats = StatsService.get_weekly_stats()
        return response(stats)
    except Exception as e:
        logger.exception("Error getting weekly stats")
        return bad_request(f"Error retrieving statistics: {str(e)}")


@require_GET
def api_stats_summary(request):
    """Get summary of all statistics."""
    try:
        stats = StatsService.get_stats_summary()
        return response(stats)
    except Exception as e:
        logger.exception("Error getting stats summary")
        return bad_request(f"Error retrieving statistics: {str(e)}")
