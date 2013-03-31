"""
jQuery templates use constructs like:

{{if condition}} print something{{/if}}

This, of course, completely screws up Django templates,
because Django thinks {{ and }} means something.

Wrap {% verbatim %} and {% endverbatim %} around those
blocks of jQuery templates and this will try its best
to output the contents with no changes.

This version of verbatim template tag allows you to use tags
like url {% url name %} or {% csrf_token %} within.
"""

from django import template

register = template.Library()


class VerbatimNode(template.Node):
    def __init__(self, text_and_nodes):
        self.text_and_nodes = text_and_nodes

    def render(self, context):
        output = ""

        # If its text we concatenate it, otherwise it's a node and we render it
        for bit in self.text_and_nodes:
            if isinstance(bit, basestring):
                output += bit
            else:
                output += bit.render(context)

        return output

@register.tag
def verbatim(parser, token):
    text_and_nodes = []
    while 1:
        token = parser.tokens.pop(0)
        if token.contents == 'endverbatim':
            break

        if token.token_type == template.TOKEN_VAR:
            text_and_nodes.append('{{')
            text_and_nodes.append(token.contents)

        elif token.token_type == template.TOKEN_TEXT:
            text_and_nodes.append(token.contents)

        elif token.token_type == template.TOKEN_BLOCK:
            try:
                command = token.contents.split()[0]
            except IndexError:
                parser.empty_block_tag(token)

            try:
                compile_func = parser.tags[command]
            except KeyError:
                parser.invalid_block_tag(token, command, None)
            try:
                node = compile_func(parser, token)
            except template.TemplateSyntaxError, e:
                if not parser.compile_function_error(token, e):
                    raise

            text_and_nodes.append(node)

        if token.token_type == template.TOKEN_VAR:
            text_and_nodes.append('}}')

    return VerbatimNode(text_and_nodes)