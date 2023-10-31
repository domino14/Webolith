from django.urls import re_path

from flashcards.views import main, new_quiz

urlpatterns = [
    re_path(r"^$", main),
    re_path(r"^api/new_quiz$", new_quiz),
]
