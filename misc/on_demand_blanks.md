### UX

The UX for on-demand-blanks should be a bit special, and we should move
some of those changes to the regular quizzes.

Game Inactive Area has a START button, and Solutions/ Challenge Results buttons.

START button should be context-aware:
- if the first part of the quiz is done (i.e. all words have been quizzed on once):
    - button should say Quiz on Missed
    - a new button should show up that says More Like This or similar:
        - Should load next challenge, next set of 500, next blank search, etc
        - This button should only show up for challenges, word searches (maybe, if prob based?), blank searches
        - Not for aerolith lists or saved lists
- if the quiz is not yet done:
    - button should say Continue
