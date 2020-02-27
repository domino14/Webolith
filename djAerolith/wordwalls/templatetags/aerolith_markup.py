# Thank you https://www.dominicrodger.com/django-markdown.html
import markdown

import bleach
from django import template
from django.template.defaultfilters import stringfilter
from django.utils.encoding import force_text
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter(is_safe=True)
@stringfilter
def my_markdown(value):
    extensions = [
        "nl2br",
    ]
    allowed_tags = [
        "a",
        "abbr",
        "acronym",
        "b",
        "br",
        "blockquote",
        "code",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "li",
        "ol",
        "p",
        "strike",
        "strong",
        "ul",
    ]

    sanitized_html = bleach.clean(
        markdown.markdown(
            force_text(value),
            extensions=extensions,
            safe_mode=True,
            enable_attributes=False,
        ),
        tags=allowed_tags,
    )

    return mark_safe(sanitized_html)
