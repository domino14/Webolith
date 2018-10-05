import copy
import logging

from base.models import AlphagramTag, alphagrammize

from lib.domain import Alphagram
from lib.macondo_interface import anagram_letters, MacondoError
from lib.query_generator.clauses import (
    WhereBetweenClause, WhereInClause, WhereEqualsClause, LimitOffsetClause
)
from lib.query_generator.exceptions import BadInput
from lib.word_searches import SearchDescription

logger = logging.getLogger(__name__)
MAX_CHUNK_SIZE = 950


def get_alphas_from_word_list(word_list: list):
    alpha_set = set()
    for word in word_list:
        alpha_set.add(alphagrammize(word))
    return [Alphagram(a) for a in alpha_set]


class Query:
    """ A query is a single word lookup SQL query, with bind parameters. """
    query_template = """
        SELECT lexicon_symbols, definition, front_hooks, back_hooks,
        inner_front_hook, inner_back_hook, word, alphagram, probability,
        combinations FROM (
            SELECT alphagrams.probability, alphagrams.combinations,
                alphagrams.alphagram
            FROM alphagrams
            WHERE {where_clause}
            ORDER BY alphagrams.probability
            {limit_offset_clause}) q
        INNER JOIN words w using (alphagram)
    """

    def __init__(self, bind_params):
        self.bind_params = bind_params

    def render(self, where_clauses, limit_offset_clause=None):
        self.query_string = self.query_template.format(
            where_clause=' AND '.join(where_clauses),
            limit_offset_clause=limit_offset_clause or '')
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
    LISTING_CONDITIONS = [
        SearchDescription.PROB_LIST, SearchDescription.ALPHAGRAM_LIST,
        SearchDescription.HAS_TAGS, SearchDescription.PROB_LIMIT,
        SearchDescription.MATCHING_ANAGRAM
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
        elif condition == SearchDescription.NOT_IN_LEXICON:
            if description['lexicon'] == 'other_english':
                column = 'contains_word_uniq_to_lex_split'
            elif description['lexicon'] == 'update':
                column = 'contains_update_to_lex'
            return WhereEqualsClause(
                table='alphagrams',
                column=column,
                condition_params={
                    'value': 1
                }
            )

        # At most one of the following four clauses should be present.
        # It must also be the last clause!
        elif condition in self.LISTING_CONDITIONS:
            if condition == SearchDescription.MATCHING_ANAGRAM:
                try:
                    qs = anagram_letters(self.lexicon_name,
                                         description['letters'])
                except MacondoError as e:
                    raise BadInput(e)
                alphas = get_alphas_from_word_list(qs)
                return WhereInClause(
                    table='alphagrams',
                    column='alphagram',
                    condition_params={
                        'in_list': [a.alphagram for a in alphas]
                    }
                )

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

    def generate_limit_offset_clause(self, condition, description):
        if condition == SearchDescription.PROB_LIMIT:
            return LimitOffsetClause(description)

    def validate(self):
        num_mutex_descriptions = 0
        search_descriptions = self.configs['search_descriptions']
        condition_order_problem = False
        for idx, description in enumerate(search_descriptions):
            if description['condition'] in self.LISTING_CONDITIONS:
                if idx != len(search_descriptions) - 1:
                    condition_order_problem = True
                num_mutex_descriptions += 1
        if num_mutex_descriptions > 1:
            return 'Mutually exclusive search conditions not allowed.'
        if condition_order_problem:
            return ('A "probability limit" or "matching anagrams" condition '
                    'must be last.')

    def generate(self):
        """ Most things in search_descriptions should basically be a
        WHERE clause. """
        where_clauses = []
        limit_offset_clause = None
        queries = []
        bind_params = []

        val_error = self.validate()
        if val_error:
            raise BadInput(val_error)

        for description in self.configs['search_descriptions']:
            wc = self.generate_where_clause(description['condition'],
                                            description)
            if wc:
                where_clauses.append(wc)
            # limit_offset should basically be the last valid value of it.
            limit_offset_clause = self.generate_limit_offset_clause(
                description['condition'], description) or limit_offset_clause

        rendered_where_clauses = []
        queries_already_generated = False
        logger.debug('Where clauses: %s', where_clauses)
        logger.debug('limit_offset: %s', limit_offset_clause)

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
                logger.debug('in_length is None, appended %s', r)
                rendered_where_clauses.append(r)
                bind_params.extend(bp)

        if queries_already_generated:
            if limit_offset_clause is not None:
                # This is all screwed up.
                raise BadInput('Incompatible query arguments; please try a '
                               'simpler query (Hint: remove probability limit '
                               'or similar)')
        else:
            if limit_offset_clause:
                rendered_lo_clause, bp = limit_offset_clause.render()
                bind_params.extend(bp)
            else:
                rendered_lo_clause = None
            queries.append(
                Query(bind_params).render(
                    where_clauses=rendered_where_clauses,
                    limit_offset_clause=rendered_lo_clause)
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
