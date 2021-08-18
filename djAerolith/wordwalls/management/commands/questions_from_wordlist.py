from django.core.management.base import BaseCommand, CommandError

from base.models import Lexicon
from base.utils import get_alphas_from_words
from lib.wdb_interface.wdb_helper import questions_from_alphagrams

MAX_WORDS = 10000

SEPARATOR = "------"


class Command(BaseCommand):
    help = """
    Given a linebreak-separated file with words or alphagrams,
    generate a list of questions that are compatible with the daily
    challenge / base.WordList format.
    """

    def add_arguments(self, parser):
        parser.add_argument("path", type=str)
        parser.add_argument("lexicon", type=str)

    def handle(self, *args, **options):
        if "path" not in options:
            raise CommandError("You must provide a file path")
        if "lexicon" not in options:
            raise CommandError("You must provide a lexicon name")

        path = options["path"]
        with open(path) as f:
            contents = f.read()

        for chunk in contents.split(SEPARATOR):
            lex = Lexicon.objects.get(lexiconName=options["lexicon"])
            alphas = get_alphas_from_words(chunk, MAX_WORDS)
            questions = questions_from_alphagrams(lex, alphas)
            print(questions.to_json())
            print(SEPARATOR)
