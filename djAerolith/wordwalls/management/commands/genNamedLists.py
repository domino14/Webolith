"""Generate the "named" default Aerolith lists."""

import json
import time
import logging

from django.core.management.base import BaseCommand
from django.db import connection

from base.models import Lexicon, alphagrammize
from wordwalls.models import NamedList
from lib.wdb_interface.wdb_helper import word_search
from lib.wdb_interface.word_searches import SearchDescription

logger = logging.getLogger(__name__)
friendly_number_map = {
    2: "Twos",
    3: "Threes",
    4: "Fours",
    5: "Fives",
    6: "Sixes",
    7: "Sevens",
    8: "Eights",
    9: "Nines",
    10: "Tens",
    11: "Elevens",
    12: "Twelves",
    13: "Thirteens",
    14: "Fourteens",
    15: "Fifteens",
}

mapa_amigable = {
    2: "Dos",
    3: "Tres",
    4: "Cuatros",
    5: "Cincos",
    6: "Seis",
    7: "Sietes",
    8: "Ochos",
    9: "Nueves",
    10: "Diez",
    11: "Onces",
    12: "Doces",
    13: "Treces",
    14: "Catorces",
    15: "Quinces",
}

LIST_GRANULARITY = 1000
COMMON_WORDS_DIR = "base/misc/"
OWL2_LEX_INDEX = 4
FRIENDLY_COMMON_SHORT = "Common Short Words (8 or fewer letters)"
FRIENDLY_COMMON_LONG = "Common Long Words (greater than 8 letters)"


def create_named_list(
    lexicon, num_questions, word_length, is_range, questions, name
):
    if num_questions == 0:
        logger.debug(">> Not creating empty list " + name)
        return

    nl = NamedList(
        lexicon=lexicon,
        numQuestions=num_questions,
        wordLength=word_length,
        isRange=is_range,
        questions=questions,
        name=name,
    )
    nl.full_clean()
    nl.save()


def create_wl_lists(i, lex):
    """Create word lists for words with length `i`."""
    logger.debug("Creating WL for lex %s, length %s", lex.lexiconName, i)
    length_counts = json.loads(lex.lengthCounts)
    num_for_this_length = length_counts[str(i)]
    create_named_list(
        lex,
        num_for_this_length,
        i,
        True,
        json.dumps([1, num_for_this_length]),
        "The " + friendly_number_map[i],
    )
    if i >= 7 and i <= 9:
        # create 'every x' list
        for p in range(1, num_for_this_length + 1, LIST_GRANULARITY):
            min_p = p
            max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
            create_named_list(
                lex,
                max_p - min_p + 1,
                i,
                True,
                json.dumps([min_p, max_p]),
                "{} ({} to {})".format(friendly_number_map[i], p, max_p),
            )

    if i >= 4 and i <= 8:
        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.matching_anagram("[JQXZ]" + "?" * (i - 1)),
            ]
        ).to_python()

        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "JQXZ " + friendly_number_map[i],
        )

    if i == 7:
        # 4+ vowel 7s
        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.matching_anagram(
                    "[AEIOU][AEIOU][AEIOU][AEIOU]???"
                ),
            ]
        ).to_python()
        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "Sevens with 4 or more vowels",
        )
    if i == 8:
        # 5+ vowel 8s
        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.matching_anagram(
                    "[AEIOU][AEIOU][AEIOU][AEIOU][AEIOU]???"
                ),
            ]
        ).to_python()
        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "Eights with 5 or more vowels",
        )

    if lex.lexiconName == "NWL20":
        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.length(i, i),
                SearchDescription.not_in_lexicon("other_english"),
            ]
        ).to_python()
        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "NWL20 {} not in CSW21".format(friendly_number_map[i]),
        )

    if lex.lexiconName == "CSW21":
        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.length(i, i),
                SearchDescription.not_in_lexicon("other_english"),
            ]
        ).to_python()
        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "CSW21 {} not in NWL20".format(friendly_number_map[i]),
        )


def createNamedLists(lex):
    """Create the lists for every word length, given a lexicon."""
    # create lists for every word length
    t1 = time.time()
    for i in range(2, 16):
        create_wl_lists(i, lex)

    if lex.lexiconName == "OWL2":
        create_common_words_lists()

    logger.debug("%s, elapsed %s", lex, time.time() - t1)


def create_spanish_lists():
    lex = Lexicon.objects.get(lexiconName="FISE2")
    for i in range(2, 16):
        logger.debug("Creating WL for lex %s, length %s", lex.lexiconName, i)
        length_counts = json.loads(lex.lengthCounts)
        num_for_this_length = length_counts[str(i)]

        create_named_list(
            lex,
            num_for_this_length,
            i,
            True,
            json.dumps([1, num_for_this_length]),
            "Los " + mapa_amigable[i],
        )
        if i >= 7 and i <= 8:
            # create 'every x' list
            for p in range(1, num_for_this_length + 1, LIST_GRANULARITY):
                min_p = p
                max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
                create_named_list(
                    lex,
                    max_p - min_p + 1,
                    i,
                    True,
                    json.dumps([min_p, max_p]),
                    "{} ({} a {})".format(mapa_amigable[i], p, max_p),
                )

        if i >= 4 and i <= 8:
            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[JQXZ]" + "?" * (i - 1)
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                "JQXZ " + mapa_amigable[i],
            )

            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[123Ñ]" + "?" * (i - 1)
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                "(ᴄʜ)(ʟʟ)(ʀʀ)Ñ " + mapa_amigable[i],
            )

        if i == 7:
            # 4+ vowel 7s
            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[AEIOU][AEIOU][AEIOU][AEIOU]???"
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                "Sietes con 4 o más vocales",
            )
        if i == 8:
            # 5+ vowel 8s
            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[AEIOU][AEIOU][AEIOU][AEIOU][AEIOU]???"
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                "Ochos con 5 o más vocales",
            )

        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.length(i, i),
                SearchDescription.not_in_lexicon("update"),
            ]
        ).to_python()
        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "FISE2 {} nuevos".format(mapa_amigable[i]),
        )


def create_polish_lists():
    lex = Lexicon.objects.get(lexiconName="OSPS44")
    for i in range(2, 16):
        logger.debug("Creating WL for lex %s, length %s", lex.lexiconName, i)
        length_counts = json.loads(lex.lengthCounts)
        num_for_this_length = length_counts[str(i)]

        create_named_list(
            lex,
            num_for_this_length,
            i,
            True,
            json.dumps([1, num_for_this_length]),
            "The " + friendly_number_map[i],
        )
        if i >= 7 and i <= 8:
            # create 'every x' list
            for p in range(1, num_for_this_length + 1, LIST_GRANULARITY):
                min_p = p
                max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
                create_named_list(
                    lex,
                    max_p - min_p + 1,
                    i,
                    True,
                    json.dumps([min_p, max_p]),
                    "{} ({} to {})".format(friendly_number_map[i], p, max_p),
                )

        if i >= 4 and i <= 8:
            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[ĄĆĘŃÓŚŹŻ]" + "?" * (i - 1)
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                friendly_number_map[i] + " with any of ĄĆĘŃÓŚŹŻ",
            )

        # New words
        qs = word_search(
            [
                SearchDescription.lexicon(lex),
                SearchDescription.length(i, i),
                SearchDescription.not_in_lexicon("update"),
            ]
        ).to_python()
        create_named_list(
            lex,
            len(qs),
            i,
            False,
            json.dumps(qs),
            "OSPS44 {} not in OSPS42".format(friendly_number_map[i]),
        )


def create_german_lists():
    lex = Lexicon.objects.get(lexiconName="Deutsch")
    # deutsch list only goes up to 9 for now :/
    for i in range(2, 10):
        logger.debug("Creating WL for lex %s, length %s", lex.lexiconName, i)
        length_counts = json.loads(lex.lengthCounts)
        num_for_this_length = length_counts[str(i)]

        create_named_list(
            lex,
            num_for_this_length,
            i,
            True,
            json.dumps([1, num_for_this_length]),
            "The " + friendly_number_map[i],
        )
        if i >= 7 and i <= 8:
            # create 'every x' list
            for p in range(1, num_for_this_length + 1, LIST_GRANULARITY):
                min_p = p
                max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
                create_named_list(
                    lex,
                    max_p - min_p + 1,
                    i,
                    True,
                    json.dumps([min_p, max_p]),
                    "{} ({} to {})".format(friendly_number_map[i], p, max_p),
                )

        if i >= 4 and i <= 8:
            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[ÄJÖQÜVXY]" + "?" * (i - 1)
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                friendly_number_map[i] + " with any of ÄJÖQÜVXY",
            )


def create_french_lists():
    lex = Lexicon.objects.get(lexiconName="FRA20")
    for i in range(2, 15):
        logger.debug("Creating WL for lex %s, length %s", lex.lexiconName, i)
        length_counts = json.loads(lex.lengthCounts)
        num_for_this_length = length_counts[str(i)]

        create_named_list(
            lex,
            num_for_this_length,
            i,
            True,
            json.dumps([1, num_for_this_length]),
            "The " + friendly_number_map[i],
        )
        if i >= 7 and i <= 9:
            # create 'every x' list
            for p in range(1, num_for_this_length + 1, LIST_GRANULARITY):
                min_p = p
                max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
                create_named_list(
                    lex,
                    max_p - min_p + 1,
                    i,
                    True,
                    json.dumps([min_p, max_p]),
                    "{} ({} to {})".format(friendly_number_map[i], p, max_p),
                )

        if i >= 4 and i <= 8:
            qs = word_search(
                [
                    SearchDescription.lexicon(lex),
                    SearchDescription.matching_anagram(
                        "[JKQWXYZ]" + "?" * (i - 1)
                    ),
                ]
            ).to_python()
            create_named_list(
                lex,
                len(qs),
                i,
                False,
                json.dumps(qs),
                friendly_number_map[i] + " with any of JKQWXYZ",
            )


def create_common_words_lists():
    """Creates common words lists for OWL2."""
    return
    create_common_words_list("common_short.txt", FRIENDLY_COMMON_SHORT)
    create_common_words_list("common_long.txt", FRIENDLY_COMMON_LONG)


def create_common_words_list(lname, friendly_name):
    f = open(COMMON_WORDS_DIR + lname)
    words = f.read()
    f.close()
    words = words.split("\n")
    alphs = set([alphagrammize(word) for word in words])
    cursor = connection.cursor()
    cursor.execute(
        "SELECT probability_pk FROM base_alphagram "
        "WHERE lexicon_id = %s AND alphagram in %s"
        % (OWL2_LEX_INDEX, str(tuple(alphs)))
    )
    rows = cursor.fetchall()
    pks = []
    for row in rows:
        pks.append(row[0])
    nl = NamedList(
        lexicon=Lexicon.objects.get(lexiconName="OWL2"),
        numQuestions=len(pks),
        wordLength=0,
        isRange=False,
        questions=json.dumps(pks),
        name=friendly_name,
    )

    nl.save()


class Command(BaseCommand):
    help = """Populates database with named lists"""

    def handle(self, **options):
        import time

        start = time.time()
        NamedList.objects.filter(lexicon__lexiconName__in=["NWL20"]).delete()
        for lex in Lexicon.objects.filter(lexiconName__in=["NWL20", "CSW21"]):
            createNamedLists(lex)
        # create_spanish_lists()
        # NamedList.objects.filter(lexicon__lexiconName="OSPS44").delete()
        create_french_lists()
        # for lex in Lexicon.objects.filter(lexiconName__in=["NWL20"]):
        #     createNamedLists(lex)
        print(f"Elapsed: {time.time()-start} s")
