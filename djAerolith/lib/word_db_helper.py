"""
Helper / util functions to simulate an ORM, for accessing the word/
alphagram sqlite dbs.

"""
import sqlite3
import os
import logging
import json
import random
import time
import sys
import copy

from django.conf import settings

from base.models import AlphagramTag
from lib.word_searches import SearchDescription


logger = logging.getLogger(__name__)
MAX_CHUNK_SIZE = 950


class BadInput(Exception):
    pass


def stdout_encode(u, default='UTF8'):
    if sys.stdout.encoding:
        return u.encode(sys.stdout.encoding)
    return u.encode(default)


class Word:
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
        return stdout_encode(self.__str__())

    def __str__(self):
        return '{%s}' % self.word

    def __eq__(self, other):
        return self.word == other.word


class Alphagram:
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
        return stdout_encode(self.__str__())

    def __str__(self):
        return '{%s} (%s)' % (self.alphagram, self.probability)


class Questions:
    def __init__(self):
        self.questions = []
        self.build_mode = False

    def questions_array(self):
        return self.questions

    def set_build_mode(self):
        self.build_mode = True

    def append(self, question):
        self.questions.append(question)

    def extend(self, questions):
        self.questions.extend(questions.questions)

    def size(self):
        return len(self.questions)

    def __len__(self):
        return self.size()

    def __getitem__(self, key):
        logger.debug('Calling __getitem__ with key %s', key)
        return self.questions[key]

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
        challenge. We will be missing meta info as this only loads
        words and alphagram strings.

        """
        qs = json.loads(json_string)
        self.set_from_list(qs)

    def set_from_list(self, qs):
        """
        Set Questions from a Python list, that looks like
        [{'q': 'ABC', 'a': ['CAB']}, ... ]

        """
        self.clear()
        for q in qs:
            question = Question()
            question.set_from_obj(q)
            self.append(question)

    def sort_by_probability(self):
        self.questions.sort(key=lambda q: q.alphagram.probability)

    def alphagram_string_set(self):
        return set(self.alphagram_string_list())

    def alphagram_string_list(self):
        return [a.alphagram.alphagram for a in self.questions]

    def __repr__(self):
        return stdout_encode(self.__str__())

    def __str__(self):
        return '{<Questions %s>}' % self.questions


class Question:
    def __init__(self, alphagram=None, answers=None):
        """
        alphagram - An Alphagram object.
        answers - A list of Word objects. see word_db_helper.py

        """
        self.alphagram = alphagram
        self.answers = answers

    def set_answers_from_word_list(self, word_list):
        self.answers = []
        for word in word_list:
            self.answers.append(Word(word=word))

    def to_python_full(self):
        """ A complete representation of question. """
        q = {
            'question': self.alphagram.alphagram,
            'probability': self.alphagram.probability,
            'answers': []
        }
        for a in self.answers:
            q['answers'].append({
                'word': a.word,
                'def': a.definition,
                'f_hooks': a.front_hooks,
                'b_hooks': a.back_hooks,
                'symbols': a.lexicon_symbols,
                'f_inner': a.inner_front_hook,
                'b_inner': a.inner_back_hook
            })
        return q

    def to_python(self):
        return {'q': self.alphagram.alphagram,
                'a': [w.word for w in self.answers]}

    def set_from_obj(self, obj):
        self.alphagram = Alphagram(obj['q'])
        self.set_answers_from_word_list(obj['a'])

    def __repr__(self):
        return stdout_encode(self.__str__())

    def __str__(self):
        return '<Question: %s (%s)>' % (self.alphagram,
                                        self.answers)


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


class WhereClause:
    template = '{table}.{column} {condition}'
    CONDITION_BETWEEN = 'between'
    CONDITION_IN = 'in'

    def __init__(self, table, column, condition, condition_params):
        self.table = table
        self.column = column
        self.condition = condition
        self.condition_params = condition_params
        logger.debug('Initialized where clause: %s %s %s %s',
                     self.table, self.column, self.condition,
                     self.condition_params)

    def render(self):
        raise NotImplementedError

    def __repr__(self):
        return '<{}>'.format(self.__str__())

    def __str__(self):
        return '{}.{} {} {}'.format(self.table, self.column,
                                     self.condition, self.condition_params)


class WhereBetweenClause(WhereClause):
    def __init__(self, table, column, condition_params):
        super(WhereBetweenClause, self).__init__(table, column,
                                                 WhereClause.CONDITION_BETWEEN,
                                                 condition_params)
        self.in_length = None

    def render(self):
        condition = ''
        bind_params = []

        if self.condition_params['min'] != self.condition_params['max']:
            condition = 'between ? and ?'
            bind_params.extend([self.condition_params['min'],
                                self.condition_params['max']])
        else:
            condition = '= ?'
            bind_params.append(self.condition_params['min'])
        return (self.template.format(table=self.table,
                                     column=self.column,
                                     condition=condition), bind_params)


class WhereInClause(WhereClause):
    def __init__(self, table, column, condition_params):
        super(WhereInClause, self).__init__(table, column,
                                            WhereClause.CONDITION_IN,
                                            condition_params)
        self.in_length = len(self.in_list())

    def in_list(self):
        return self.condition_params['in_list']

    def render(self):
        bind_params = []
        if self.in_length >= 2:
            condition = 'in ({})'.format(','.join(['?'] * self.in_length))
            bind_params.extend(self.in_list())
        elif self.in_length == 1:
            condition = '= ?'
            bind_params.append(self.in_list()[0])
        else:
            raise BadInput('No results found.')
        return (self.template.format(table=self.table,
                                     column=self.column,
                                     condition=condition), bind_params)


class Query:
    """ A query is a single word lookup SQL query, with bind parameters. """
    query_template = """
        SELECT lexicon_symbols, definition, front_hooks, back_hooks,
        inner_front_hook, inner_back_hook, word, words.alphagram,
        alphagrams.probability, alphagrams.combinations FROM words
        INNER JOIN alphagrams ON words.alphagram = alphagrams.alphagram
        WHERE {where_clause}
        ORDER BY alphagrams.probability
    """

    def __init__(self, bind_params):
        self.bind_params = bind_params

    def render(self, where_clauses):
        self.query_string = self.query_template.format(
            where_clause=' AND '.join(where_clauses))
        return self

    def execution_context(self):
        if not hasattr(self, 'query_string'):
            raise Exception('Query has not been rendered')
        return self.query_string, self.bind_params

    def __repr__(self):
        return '<{}>'.format(self.__str__())

    def __str__(self):
        return 'query_string="{query}" bind_params={bind_params}'.format(
            query=self.query_string, bind_params=self.bind_params)


class QueryGenerator:
    """ Generate the query based on passed-in parameters. """
    LISTING_DESCRIPTIONS = [
        SearchDescription.PROB_LIST, SearchDescription.ALPHAGRAM_LIST,
        SearchDescription.HAS_TAGS
    ]

    def __init__(self, configs, lexicon_name):
        """ configs is an object describing what kind of query to generate. """
        self.configs = configs
        self.lexicon_name = lexicon_name

    def generate_where_clause(self, condition, description):
        if condition == SearchDescription.LENGTH:
            return WhereBetweenClause(
                table='alphagrams',
                column='length',
                condition_params=description,
            )
        elif condition == SearchDescription.NUM_ANAGRAMS:
            return WhereBetweenClause(
                table='alphagrams',
                column='num_anagrams',
                condition_params=description)

        elif condition == SearchDescription.PROB_RANGE:
            return WhereBetweenClause(
                table='alphagrams',
                column='probability',
                condition_params=description
            )
        elif condition == SearchDescription.NUM_VOWELS:
            return WhereBetweenClause(
                table='alphagrams',
                column='num_vowels',
                condition_params=description
            )
        elif condition == SearchDescription.POINT_VALUE:
            return WhereBetweenClause(
                table='alphagrams',
                column='point_value',
                condition_params=description
            )
        # At most one of the following three clauses should be present.
        # It must also be the last clause!
        elif condition in self.LISTING_DESCRIPTIONS:
            if condition == SearchDescription.PROB_LIST:
                return WhereInClause(
                    table='alphagrams',
                    column='probability',
                    condition_params={
                        'in_list': description['p_list'],
                    }
                )

            elif condition == SearchDescription.ALPHAGRAM_LIST:
                return WhereInClause(
                    table='alphagrams',
                    column='alphagram',
                    condition_params={
                        'in_list': description['a_list'],
                    }
                )

            elif condition == SearchDescription.HAS_TAGS:
                return WhereInClause(
                    table='alphagrams',
                    column='alphagram',
                    condition_params={
                        'in_list': get_tagged_alphagrams(description['tags'],
                                                         description['user'],
                                                         self.lexicon_name)
                    }
                )

    def validate(self):
        num_mutex_descriptions = 0
        search_descriptions = self.configs['search_descriptions']
        for idx, description in enumerate(search_descriptions):
            if description in self.LISTING_DESCRIPTIONS:
                if idx != len(search_descriptions) - 1:
                    return 'A list search condition must be last.'
                num_mutex_descriptions += 1
        if num_mutex_descriptions > 1:
            return 'Mutually exclusive search conditions not allowed.'

    def generate(self):
        """ Most things in search_descriptions should basically be a
        WHERE clause. """
        where_clauses = []
        queries = []
        bind_params = []

        val_error = self.validate()
        if val_error:
            raise BadInput(val_error)

        for description in self.configs['search_descriptions']:
            where_clauses.append(self.generate_where_clause(
                description['condition'], description))
        rendered_where_clauses = []
        queries_already_generated = False
        logger.debug('Where clauses: %s', where_clauses)
        for wc in where_clauses:
            if wc.in_length is not None:
                idx = 0
                if wc.in_length == 0:
                    # This will automatically return nothing. Raise an error.
                    raise BadInput('Query returns no results.')
                while idx < wc.in_length:
                    new_where_clause = WhereInClause(
                        table=wc.table,
                        column=wc.column,
                        condition_params={
                            'in_list': wc.in_list()[idx:idx+MAX_CHUNK_SIZE]
                        })

                    r, bp = new_where_clause.render()
                    rendered_where_clauses.append(r)

                    queries.append(
                        Query(copy.deepcopy(bind_params) + bp).render(
                            where_clauses=rendered_where_clauses)
                    )
                    # And then pop the specific where clause.
                    rendered_where_clauses.pop()
                    queries_already_generated = True
                    idx += MAX_CHUNK_SIZE

            else:
                r, bp = wc.render()
                rendered_where_clauses.append(r)
                bind_params.extend(bp)

        if not queries_already_generated:
            queries.append(
                Query(bind_params).render(where_clauses=rendered_where_clauses)
            )
        logger.debug('Generated queries: %s', queries)
        return queries


def get_tagged_alphagrams(tags, user, lexicon_name):
    """
    Get a list of all tagged alphagrams matching the above. Use the
    Django ORM; this is not a SQLite-backed database.

    """
    tagged = AlphagramTag.objects.filter(user=user, tag__in=tags,
                                         lexicon__lexiconName=lexicon_name)
    return [t.alphagram for t in tagged]


def word_search(search_descriptions):
    """
    search_descriptions is an array of search descriptions to be applied
    in order from left to right. Order usually shouldn't matter except
    for the final limit_probability clause, or as a small optimization.

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
