from django.template import TemplateSyntaxError, Node, Variable, Library
from django.conf import settings

register = Library()

@register.tag
def value_from_settings(parser, token):
    try:
        # split_contents() knows not to split quoted strings.
        tag_name, var = token.split_contents()
    except ValueError:
        raise TemplateSyntaxError, "%r tag requires a single argument" % token.contents.split()[0]
    return ValueFromSettings(var)

class ValueFromSettings(Node):
    def __init__(self, var):
        self.arg = Variable(var)
    def render(self, context):        
        return settings.__getattr__(str(self.arg))