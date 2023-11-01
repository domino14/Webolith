from django.utils.translation import gettext as _
from django.utils.translation import ngettext


def pretty_date(now, time):
    """
    Get a datetime object and return a
    pretty string like 'an hour ago', 'Yesterday', '3 months ago',
    'just now', etc
    """

    diff = now - time
    second_diff = diff.seconds
    day_diff = diff.days

    if day_diff < 0:
        return ""

    if day_diff == 0:
        if second_diff < 10:
            return _("just now")
        if second_diff < 60:
            return _("%(seconds)d seconds ago") % {"seconds": second_diff}
        if second_diff < 120:
            return _("a minute ago")
        if second_diff < 3600:
            return _("%(minutes)d minutes ago") % {"minutes": second_diff / 60}
        if second_diff < 7200:
            return _("an hour ago")
        if second_diff < 86400:
            return _("%(hours)d hours ago") % {"hours": second_diff / 3600}
    if day_diff == 1:
        return _("Yesterday")
    if day_diff < 7:
        return _("%(day_diff)d days ago") % {"day_diff": day_diff}
    if day_diff < 31:
        return ngettext("%(week)d week ago", "%(week)d weeks ago", day_diff / 7) % {
            "week": day_diff / 7
        }
    if day_diff < 365:
        return ngettext(
            "%(month)d month ago", "%(month)d months ago", day_diff / 30
        ) % {"month": day_diff / 30}
    return ngettext("%(year)d year ago", "%(year)d years ago", day_diff / 365) % {
        "year": day_diff / 365
    }
