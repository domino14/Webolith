"""
Helper / util functions to simulate an ORM, for accessing the word/
alphagram sqlite dbs.

"""
import sqlite3
import os
import logging
import json
import random

from django.conf import settings

logger = logging.getLogger(__name__)


class BadInput(Exception):
    pass


class Word(object):
    def __init__(self, word, alphagram=None, definition=None, front_hooks=None,
                 back_hooks=None, inner_front_hook=None, inner_back_hook=None,
                 lexicon_symbols=None):
        self.word = word
        self.alphagram = alphagram
        # Disallow None, to keep compatibility with old code.
        self.definition = definition or ''
        self.front_hooks = front_hooks or ''
        self.back_hooks = back_hooks or ''
        self.lexicon_symbols = lexicon_symbols or ''
        self.inner_front_hook = True if inner_front_hook == 1 else False
        self.inner_back_hook = True if inner_back_hook == 1 else False

    def __repr__(self):
        return '{%s}' % self.word


class Alphagram(object):
    def __init__(self, alphagram, probability=None, combinations=None):
        self.alphagram = alphagram
        self.probability = probability
        self.length = len(alphagram)
        self.combinations = combinations

    def __eq__(self, other):
        return self.alphagram == other.alphagram

    def __ne__(self, other):
        return not self.__eq__(other)

    def __repr__(self):
        return '{%s}' % self.alphagram


class Questions(object):
    def __init__(self):
        self.questions = []

    def questions_array(self):
        return self.questions

    def append(self, question):
        self.questions.append(question)

    def extend(self, questions):
        self.questions.extend(questions.questions)

    def size(self):
        return len(self.questions)

    def shuffle(self):
        random.shuffle(self.questions)

    def clear(self):
        self.questions = []

    def to_python(self):
        return [q.to_python() for q in self.questions]

    def to_json(self):
        return json.dumps(self.to_python())

    def set_from_json(self, json_string):
        """
        Set Questions from a JSON string. Useful when loading from a
        word list or challenge. We will be missing meta info as this
        only loads words and alphagram strings.

        See Question.to_python for format.

        """
        qs = json.loads(json_string)
        self.clear()
        for q in qs:
            question = Question()
            question.set_from_obj(q)
            self.append(question)

    def __repr__(self):
        return '<Questions %s>' % self.questions


class Question(object):
    def __init__(self, alphagram=None, answers=None):
        """
        alphagram - An Alphagram object.
        answers - A list of Word objects. see word_db_helper.py

        """
        self.alphagram = alphagram
        self.answers = answers

    def __repr__(self):
        return '<Question: %s (%s)>' % (self.alphagram, self.answers)

    def set_answers_from_word_list(self, word_list):
        self.answers = []
        for word in word_list:
            self.answers.append(Word(word=word))

    def to_python(self):
        return {'q': self.alphagram.alphagram,
                'a': [w.word for w in self.answers]}

    def set_from_obj(self, obj):
        self.alphagram = Alphagram(obj['q'])
        self.set_answers_from_word_list(obj['a'])


class WordDB(object):
    """
    A database of words/definitions/alphagrams, created by the
    dbCreator C++ program.

    """
    def __init__(self, lexicon_name):
        """
        lexicon is an instance of base.models.Lexicon

        """
        self.conn = sqlite3.connect(os.path.join(settings.WORD_DB_LOCATION,
                                    '%s.db' % lexicon_name))

    # XXX: Only used by tests.
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
        logger.debug('Getting word data for %s words.', len(words))
        c = self.conn.cursor()
        c.execute(""" SELECT lexicon_symbols, definition, front_hooks,
                  back_hooks, inner_front_hook, inner_back_hook, alphagram,
                  word FROM words WHERE word IN (%s) ORDER BY word""" %
                  ','.join('?' * len(words)), words)
        rows = c.fetchall()
        words = []
        for row in rows:
            words.append(Word(word=row[7], definition=row[1],
                              front_hooks=row[2], back_hooks=row[3],
                              inner_front_hook=row[4], inner_back_hook=row[5],
                              lexicon_symbols=row[0], alphagram=row[6]))
        return words

    # XXX: Only used by tests.
    def get_alphagram_data(self, alphagram):
        c = self.conn.cursor()
        c.execute('SELECT probability, combinations FROM alphagrams '
                  'WHERE alphagram = ?', (alphagram,))
        row = c.fetchone()
        if row:
            return Alphagram(alphagram=alphagram, probability=row[0],
                             combinations=row[1])
        return None

    def get_alphagrams_data(self, alphagrams):
        """
        Get data for a list of passed-in strings. Some alphagrams may
        not have available data, such as those with blanks.

        """
        c = self.conn.cursor()
        c.execute('SELECT alphagram, probability, combinations FROM alphagrams'
                  ' WHERE alphagram IN (%s)' % ','.join('?' * len(alphagrams)),
                  alphagrams)
        return self._alphagrams(c)

    # XXX: Only used by tests.
    def probability(self, alphagram):
        """
        Gets the probability for the alphagram. Returns None if the
        alphagram is not found (this can be the case for words with
        blanks).

        """
        c = self.conn.cursor()
        c.execute('SELECT probability FROM alphagrams WHERE alphagram=?',
                  (alphagram,))
        row = c.fetchone()
        return row[0]

    def _alphagrams(self, c):
        """ Returns a list of alphagrams fetched by cursor `c`."""
        alphagrams = []
        rows = c.fetchall()
        for row in rows:
            alphagrams.append(Alphagram(alphagram=row[0],
                                        probability=row[1],
                                        combinations=row[2]))
        return alphagrams

    def alphagrams_by_probability_range(self, probability_min, probability_max,
                                        length):
        """ Get a list of Alphagrams by probability range. """
        c = self.conn.cursor()
        c.execute('SELECT alphagram, probability, combinations '
                  'FROM alphagrams WHERE length = ? AND '
                  'probability BETWEEN ? AND ?',
                  (length, probability_min, probability_max))
        return self._alphagrams(c)

    def alphagrams_by_probability_list(self, p_list, length):
        """ Gets a list of alphagrams for a list of probabilities."""
        # We're doing straight %-interpolation here so let's verify
        # p_list is a list of integers. Don't want to do SQL-injection.
        for p in p_list:
            if type(p) is not int:
                raise BadInput("Every probability must be an integer. %s" %
                               p_list)
        # Generate IN string.
        in_string = str(tuple(p_list))
        c = self.conn.cursor()
        c.execute('SELECT alphagram, probability, combinations '
                  'FROM alphagrams WHERE length = ? AND '
                  'probability IN %s' % in_string, (length,))

        return self._alphagrams(c)

    def get_questions_for_probability_range(self, probability_min,
                                            probability_max, length,
                                            order=True):
        """
        Use a single query to return alphagrams and words for a
        probability range, fully populated. This makes this more
        efficient than calling `get_words_for_alphagram` above
        repeatedly.

        """
        c = self.conn.cursor()
        query = """
            SELECT lexicon_symbols, definition, front_hooks, back_hooks,
            inner_front_hook, inner_back_hook, word, words.alphagram,
            alphagrams.probability, alphagrams.combinations FROM words
            INNER JOIN alphagrams ON words.alphagram = alphagrams.alphagram
            WHERE alphagrams.length = ? AND
            alphagrams.probability BETWEEN ? and ?

        """
        if order:
            query = query + "ORDER BY alphagrams.probability"
        c.execute(query, (length, probability_min, probability_max))
        rows = c.fetchall()
        return self.process_question_query(rows)

    def get_questions_from_alph_objects(self, alph_objects):
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
        words_pop = self.get_words_data(word_to_alphagram_dict.keys())

        # Then, modify the question for each word.
        for word in words_pop:
            question = word_to_alphagram_dict[word.word]
            question.answers.append(word)
        return questions

    def get_questions(self, alphagrams):
        """
        A helper function to return an entire structure, a list of
        alphagrams and words, given a list of alphagrams.

        param:
            - alphagrams - A list of Alphagram objects.

        """
        ret = Questions()
        c = self.conn.cursor()
        # Handle in 1000-alphagram chunks.

        idx = 0
        CHUNK_SIZE = 10000
        while idx < len(alphagrams):
            these_alphagrams = alphagrams[idx:idx+CHUNK_SIZE]
            num_alphas = len(these_alphagrams)
            query = """
            SELECT lexicon_symbols, definition, front_hooks, back_hooks,
            inner_front_hook, inner_back_hook, word, words.alphagram,
            alphagrams.probability, alphagrams.combinations FROM words
            INNER JOIN alphagrams ON words.alphagram = alphagrams.alphagram
            WHERE alphagrams.alphagram IN (%s) """ % ','.join('?' * num_alphas)

            idx += CHUNK_SIZE

            c.execute(query, [a.alphagram for a in these_alphagrams])

            rows = c.fetchall()

            qs = self.process_question_query(rows)
            ret.extend(qs)
        return ret

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
