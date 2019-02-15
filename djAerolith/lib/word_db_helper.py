"""
Helper / util functions to simulate an ORM, for accessing the word/
alphagram sqlite dbs.

"""
import sqlite3
import os
import logging
import time

from django.conf import settings

from lib.domain import Word, Alphagram, Question, Questions
from lib.query_generator.exceptions import BadInput
from lib.query_generator.gen import QueryGenerator, MAX_CHUNK_SIZE
from lib.word_searches import SearchDescription

logger = logging.getLogger(__name__)


class WordDB:
    """
    A database of words/definitions/alphagrams, created by the
    word_db_creator Go program.

    """
    def __init__(self, lexicon_name):
        """
        lexicon is an instance of base.models.Lexicon

        """
        file_path = os.path.join(settings.WORD_DB_LOCATION,
                                 '{0}.db'.format(lexicon_name))
        if not os.path.isfile(file_path):
            raise BadInput('Database does not exist for lexicon {0}'.format(
                           lexicon_name))
        self.conn = sqlite3.connect(file_path)
        self.lexicon_name = lexicon_name

    def get_word_data(self, word):
        """
        Gets data for the word passed in.

        """
        c = self.conn.cursor()
        c.execute('SELECT lexicon_symbols, definition, front_hooks, '
                  'back_hooks, inner_front_hook, inner_back_hook, '
                  'alphagram FROM words WHERE word = ?', (word,))
        row = c.fetchone()
        if row:
            return Word(word=word, definition=row[1], front_hooks=row[2],
                        back_hooks=row[3], inner_front_hook=row[4],
                        inner_back_hook=row[5], lexicon_symbols=row[0],
                        alphagram=row[6])
        return None

    def get_words_data(self, words):
        """ Gets data for the words passed in. """
        logger.info('Getting word data for %s words.', len(words))
        c = self.conn.cursor()
        idx = 0
        word_data = []
        while idx < len(words):
            these_words = words[idx:idx+MAX_CHUNK_SIZE]
            num_words = len(these_words)
            query = """
            SELECT lexicon_symbols, definition, front_hooks,
            back_hooks, inner_front_hook, inner_back_hook, alphagram,
            word FROM words WHERE word IN (%s) ORDER BY word
            """ % ','.join('?' * num_words)
            idx += MAX_CHUNK_SIZE
            c.execute(query, these_words)
            rows = c.fetchall()

            for row in rows:
                word_data.append(
                    Word(word=row[7], definition=row[1],
                         front_hooks=row[2], back_hooks=row[3],
                         inner_front_hook=row[4], inner_back_hook=row[5],
                         lexicon_symbols=row[0], alphagram=row[6]))
        return word_data

    def get_alphagrams_data(self, alphagrams):
        """
        Get data for a list of passed-in strings. Some alphagrams may
        not have available data, such as those with blanks.

        """

        def _alphagrams(c):
            """ Returns a list of alphagrams fetched by cursor `c`."""
            alphagrams = []
            rows = c.fetchall()
            for row in rows:
                alphagrams.append(Alphagram(alphagram=row[0],
                                            probability=row[1],
                                            combinations=row[2]))
            return alphagrams

        c = self.conn.cursor()
        ret_alphagrams = []
        idx = 0
        logger.debug('Len alphagrams: %s', len(alphagrams))
        while idx < len(alphagrams):
            these_alphagrams = alphagrams[idx:idx+MAX_CHUNK_SIZE]
            num_alphas = len(these_alphagrams)
            c.execute(
                'SELECT alphagram, probability, combinations FROM alphagrams'
                ' WHERE alphagram IN (%s)' % ','.join('?' * num_alphas),
                these_alphagrams)
            ret_alphagrams.extend(_alphagrams(c))
            idx += MAX_CHUNK_SIZE

        logger.info('get_alphagrams_data returned %s alphagrams',
                    len(ret_alphagrams))
        return ret_alphagrams

    def get_questions_from_configs(self, configs):
        t = time.time()
        qgen = QueryGenerator(configs, self.lexicon_name)
        queries = qgen.generate()
        c = self.conn.cursor()
        qs = Questions()
        for query in queries:
            # Unpack the args appropriately.
            c.execute(*query.execution_context())
            rows = c.fetchall()
            questions = self.process_question_query(rows)
            qs.extend(questions)
        logger.info('Time taken: %s s. (params: %s)', time.time() - t,
                    configs)
        return qs

    def get_questions_for_probability_list(self, p_list, length):
        for p in p_list:
            if type(p) is not int:
                raise BadInput("Every probability must be an integer. %s" %
                               p_list)
        if len(p_list) > MAX_CHUNK_SIZE:
            raise BadInput('Too many alphagrams to interpolate')

        configs = {
            'search_descriptions': [
                SearchDescription.length(length, length),
                SearchDescription.probability_list(p_list)
            ]
        }
        return self.get_questions_from_configs(configs)

    def get_questions_for_probability_range(self, p_min, p_max, length):
        """
        Use a single query to return alphagrams and words for a
        probability range, fully populated.

        """

        configs = {
            'search_descriptions': [
                SearchDescription.length(length, length),
                SearchDescription.probability_range(p_min, p_max)
            ]
        }
        return self.get_questions_from_configs(configs)

    def get_questions_from_alph_dicts(self, alph_objects):
        """
        See get_questions, but instead of Alphagram objects, the
        parameter alph_objects looks like:
        [{"q": ..., "a": [...]}, ...]

        This function is a little complicated.

        We fetch all alphagrams from the database, populating the
        probability and combinations. If the alphagrams are not in the
        database, as can happen with blank bingos, we just create an
        Alphagram object for it with no probability/extra info.

        We then fetch all words from the database and tie them back to
        the passed in alphagrams. We get all possible word data,
        including definitions, etc. We assume the words that are passed
        in will be found in the database.

        """
        word_to_alphagram_dict = {}
        questions = Questions()
        alphagrams = self.get_alphagrams_data([
            obj['q'] for obj in alph_objects])
        alph_string_to_objects = {}
        for alphagram in alphagrams:
            alph_string_to_objects[alphagram.alphagram] = alphagram
        # Create a mapping of words to initial questions
        for alph in alph_objects:
            alphagram_string = alph['q']
            if alphagram_string in alph_string_to_objects:
                # Found information for alphagram_string in database
                this_a = alph_string_to_objects[alphagram_string]
            else:
                # Alphagram string does not exist in database. Maybe
                # it's a blank bingo.
                this_a = Alphagram(alphagram_string)
            this_q = Question(this_a, [])
            for word in alph['a']:
                word_to_alphagram_dict[word] = this_q
            questions.append(this_q)
        # Populate all words fully with information from the database.
        words_pop = self.get_words_data(list(word_to_alphagram_dict.keys()))

        # Then, modify the question for each word.
        for word in words_pop:
            question = word_to_alphagram_dict[word.word]
            question.answers.append(word)
        return questions

    def get_questions_from_alphagrams(self, alphagrams):
        """
        A helper function to return an entire structure, a list of
        alphagrams and words, given a list of alphagrams.

        param:
            - alphagrams - A list of Alphagram objects.

        """

        configs = {
            'search_descriptions': [
                SearchDescription.alphagram_list(
                    [a.alphagram for a in alphagrams])
            ]
        }
        return self.get_questions_from_configs(configs)

    def process_question_query(self, rows):
        """ Process a query consisting of rows. Return a Questions object. """
        qs = Questions()
        if len(rows) == 0:
            return qs
        last_alphagram = None
        cur_words = []
        for row in rows:
            alpha = Alphagram(row[7], row[8], row[9])
            if last_alphagram is not None and alpha != last_alphagram:
                qs.append(Question(last_alphagram, cur_words))
                cur_words = []
            cur_words.append(Word(word=row[6], definition=row[1],
                             front_hooks=row[2], back_hooks=row[3],
                             inner_front_hook=row[4],
                             inner_back_hook=row[5],
                             lexicon_symbols=row[0], alphagram=alpha))
            last_alphagram = alpha
        qs.append(Question(last_alphagram, cur_words))
        return qs


def word_search(search_descriptions):
    """
    search_descriptions is an array of search descriptions to be applied
    in order from left to right. Order usually shouldn't matter except
    for the final probability_limit clause, or as a small optimization.

    Gets an array of alphagrams in format:

    [{
        "q": "ACDEF", "a": ["DECAF", "FACED"]
    }, ...]

    """
    if len(search_descriptions) < 2:
        raise BadInput('search_descriptions must have at least 2 elements')
    if search_descriptions[0]['condition'] != SearchDescription.LEXICON:
        raise BadInput('The first search description must contain a lexicon.')

    db = WordDB(search_descriptions[0]['lexicon'].lexiconName)

    configs = {
        'search_descriptions': search_descriptions[1:]
    }
    return db.get_questions_from_configs(configs)
