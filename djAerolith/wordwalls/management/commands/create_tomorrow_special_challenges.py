import datetime
import random  # shut up Josh

from django.core.management.base import BaseCommand
from django.utils import timezone

from base.models import Lexicon
from wordwalls.models import DailyChallengeName, DailyChallenge
from wordwalls.special_challenges import (get_alphagrams_for_challenge,
                                          SpecialChallengeTypes)


CHALLENGES = [
    SpecialChallengeTypes.HIGH_PROB_BINGOS,
    SpecialChallengeTypes.HIGH_PROB_7s,
    SpecialChallengeTypes.HIGH_PROB_8s,
    SpecialChallengeTypes.MED_PROB_BINGOS,
    SpecialChallengeTypes.COMMON_WORDS_SHORT,
    SpecialChallengeTypes.COMMON_WORDS_LONG,
    SpecialChallengeTypes.HIGH_VOWEL_BINGOS,
    SpecialChallengeTypes.JQXZ_SHORT_WORDS,
    SpecialChallengeTypes.SINGLE_ANAGRAM_7s,
    SpecialChallengeTypes.SINGLE_ANAGRAM_8s,
    SpecialChallengeTypes.DOUBLE_ANAGRAM_BINGOS,
    SpecialChallengeTypes.HIGH_FIVES,
    SpecialChallengeTypes.HIGH_SIXES,
    SpecialChallengeTypes.NEW_IN_LATEST_UPDATE,
    SpecialChallengeTypes.BABY_BLANKS,
]
NUM_POSSIBLE_CHALLENGES = len(CHALLENGES)


class Command(BaseCommand):
    tomorrow = (timezone.localtime(timezone.now()) +
                datetime.timedelta(days=1)).date()

    def handle(self):
        # Create three random challenges.
        random.shuffle(CHALLENGES)
        specials = DailyChallengeName.objects.filter(
            orderPriority=DailyChallengeName.SPECIAL_CHALLENGE_ORDER_PRIORITY)\
            .order_by('id')
        # Always use specials[2], [3], and [4]
        # [0] and [1] can be reserved for one-offs, things like
        # Valentine's Day, etc.
        for ln in ['America', 'CSW15']:
            for idx, challenge in enumerate(CHALLENGES[:3]):
                lex = Lexicon.objects.get(lexiconName=ln)
                DailyChallenge.objects.create(
                    lexicon=lex,
                    date=self.tomorrow,
                    name=specials[idx + 2],
                    visible_name=challenge,
                    alphagrams=get_alphagrams_for_challenge(lex, challenge),
                    seconds=300,
                )
