import logging

from lib.query_generator.exceptions import BadInput

logger = logging.getLogger(__name__)


class WhereClause:
    template = '{table}.{column} {condition}'
    CONDITION_EQUALS = 'equals'
    CONDITION_BETWEEN = 'between'
    CONDITION_IN = 'in'

    def __init__(self, table, column, condition, condition_params):
        self.table = table
        self.column = column
        self.condition = condition
        self.condition_params = condition_params
        self.in_length = None
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


class WhereEqualsClause(WhereClause):
    def __init__(self, table, column, condition_params):
        super(WhereEqualsClause, self).__init__(table, column,
                                                WhereClause.CONDITION_EQUALS,
                                                condition_params)

    def render(self):
        condition = '= ?'
        bind_params = [self.condition_params['value']]
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
            condition = f'in ({",".join(["?"] * self.in_length)})'
            bind_params.extend(self.in_list())
        elif self.in_length == 1:
            condition = '= ?'
            bind_params.append(self.in_list()[0])
        else:
            raise BadInput('No results found.')
        return (self.template.format(table=self.table,
                                     column=self.column,
                                     condition=condition), bind_params)


class LimitOffsetClause:
    template = 'LIMIT ? OFFSET ?'

    def __init__(self, condition_params):
        self.min = condition_params['min']
        self.max = condition_params['max']

    def render(self):
        self.limit = self.max - self.min + 1
        self.offset = self.min - 1
        bind_params = [self.limit, self.offset]
        return (self.template, bind_params)

    def __repr__(self):
        return '<{}>'.format(self.__str__())

    def __str__(self):
        return '{} {}'.format(self.min, self.max)
