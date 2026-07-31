"""Views for the Great Wall."""

import json
import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from base.models import EXCLUDED_LEXICA, Lexicon
from wordwalls.infinite_game import InfiniteWallError, InfiniteWallGame, locked_wall
from wordwalls.infinite_models import InfiniteWall
from wordwalls.infinite_perm import DEFAULT_CHUNK_SIZE, VALID_WORD_LENGTHS
from wordwalls.views import get_user_meta_info

logger = logging.getLogger(__name__)


def _static_srv():
    return (
        settings.WEBPACK_DEV_SERVER_URL
        if (settings.USE_WEBPACK_DEV_SERVER and settings.DEBUG)
        else ""
    )


@login_required
@ensure_csrf_cookie
@require_GET
def picker(request):
    """List the player's walls and offer to start a new one."""
    game = InfiniteWallGame()
    walls = []
    # Most recently played first. There is no index on last_activity by design
    # (see infinite_models.py); a player has few walls, so this is a trivial sort.
    for wall in (
        InfiniteWall.objects.filter(user=request.user)
        .select_related("lexicon")
        .order_by("-last_activity")[:50]
    ):
        # A wall still marked running here is either genuinely open in another
        # tab or its browser went away; the heartbeat is what distinguishes them.
        # Reap under a lock so we don't race that other tab.
        if wall.state == InfiniteWall.RUNNING:
            with locked_wall(wall.pk, request.user) as locked:
                if game.reap_if_stale(locked):
                    wall = locked

        walls.append(
            {
                "wall": wall,
                "percent": (
                    round(100.0 * wall.solved_count / wall.num_alphagrams, 2)
                    if wall.num_alphagrams
                    else 0
                ),
                "elapsed_ms": game.elapsed_ms(wall),
                # Still running means a live tab elsewhere -- say so, rather than
                # implying this page is where the clock is ticking.
                "running_elsewhere": wall.state == InfiniteWall.RUNNING,
            }
        )

    lexica = []
    for lex in Lexicon.objects.exclude(lexiconName__in=EXCLUDED_LEXICA):
        try:
            length_counts = json.loads(lex.lengthCounts)
        except (TypeError, ValueError):
            continue
        counts = {
            length: length_counts.get(str(length))
            for length in VALID_WORD_LENGTHS
            if length_counts.get(str(length))
        }
        if counts:
            lexica.append({"lexicon": lex, "counts": counts})

    return render(
        request,
        "wordwalls/infinite_picker.html",
        {
            "walls": walls,
            "lexica": lexica,
            "word_lengths": VALID_WORD_LENGTHS,
            # So the page's size hint can't drift from the real rectangle size.
            "chunk_size": DEFAULT_CHUNK_SIZE,
            "default_lexicon": request.user.aerolithprofile.defaultLexicon.pk,
        },
    )


@login_required
@require_POST
def new_wall(request):
    try:
        lexicon = Lexicon.objects.get(pk=request.POST.get("lexicon"))
        word_length = int(request.POST.get("word_length"))
    except (Lexicon.DoesNotExist, TypeError, ValueError):
        messages.error(request, "Pick a lexicon and a word length.")
        return redirect(reverse("infinite_picker"))

    try:
        wall = InfiniteWallGame().create(request.user, lexicon, word_length)
    except InfiniteWallError as e:
        messages.error(request, str(e))
        return redirect(reverse("infinite_picker"))

    return redirect(reverse("infinite_wall", args=(wall.pk,)))


@login_required
@ensure_csrf_cookie
@require_GET
def wall(request, wall_id):
    try:
        wall_obj = InfiniteWallGame().get_wall(wall_id, request.user)
    except InfiniteWallError as e:
        messages.error(request, str(e))
        return redirect(reverse("infinite_picker"))

    profile = request.user.aerolithprofile
    return render(
        request,
        "wordwalls/infinite.html",
        {
            "wall_id": wall_obj.pk,
            "lexicon": wall_obj.lexicon.lexiconName,
            "word_length": wall_obj.word_length,
            "style": profile.customWordwallsStyle,
            "user": json.dumps(get_user_meta_info(request.user)),
            "intercom_app_id": settings.INTERCOM_APP_ID,
            "STATIC_SRV": _static_srv(),
        },
    )


@login_required
@require_POST
def beacon_pause(request, wall_id):
    """
    Pause endpoint reachable from navigator.sendBeacon on tab close.

    Form-encoded rather than JSONRPC because sendBeacon cannot set an
    X-CSRFToken header; the token rides along as csrfmiddlewaretoken in the body,
    the same trick the main wordwalls table uses for its unload autosave.
    """
    try:
        with locked_wall(wall_id, request.user) as wall_obj:
            InfiniteWallGame().pause(wall_obj)
    except InfiniteWallError as e:
        logger.info("event=infinite_beacon_pause_failed wall=%s err=%s", wall_id, e)
        return HttpResponse(status=204)
    return HttpResponse(status=204)
