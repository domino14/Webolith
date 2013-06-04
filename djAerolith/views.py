# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

from django.shortcuts import render_to_response
from django.template import RequestContext
from basic.blog.models import Post, Category
import random
from django.contrib.auth.decorators import login_required
from lib.socket_helper import get_connection_token
from lib.response import response


def homepage(request):
    # get latest blog post with the "news" category

    try:
        latestPost = Post.objects.published().filter(
            categories=Category.objects.get(title="News")
        ).order_by('-publish')[0]
    except:
        latestPost = None

    return render_to_response('base.html', {'latestPost': latestPost,
                                            'image_title': get_random_title()},
                              context_instance=RequestContext(request))


def get_random_title():
    return random.choice(
        ["Infinite improbability drive activated. Please, stay and try the "
         "challenges",
         "You're turning into a penguin. Stop it.",
         "On no account allow a Vogon to read poetry at you.",
         "DON'T PANIC",
         "Once you know what the question actually is, you'll know what the "
         "answer means",
         "Please do not press this button again."
         ])


def supporter(request):
    return render_to_response('support.html',
                              context_instance=RequestContext(request))


def oldhomepage(request):
    return render_to_response('oldsite/index.html',
                              context_instance=RequestContext(request))


def about(request):
    return render_to_response('about.html',
                              context_instance=RequestContext(request))


@login_required
def socket_token(request):
    conn_token = get_connection_token(request.user)
    return response(conn_token)
