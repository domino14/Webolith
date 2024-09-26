from django.urls import re_path

from flashcards.views import main, new_quiz, add_to_wordvault

urlpatterns = [
    re_path(r"^$", main),
    re_path(r"^api/new_quiz$", new_quiz),
    re_path(r"^api/add_to_wordvault$", add_to_wordvault),
]
