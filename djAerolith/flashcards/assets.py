from django_assets import Bundle, register

cardboxJs = Bundle('js/aerolith/csrfAjax.js',
                   'js/aerolith/fileuploader.js',
                   filters='jsmin',
                   output='js/flashcards/packed.js')

register('js_cardbox', cardboxJs)

whitleyQuizJs = Bundle('js/aerolith/csrfAjax.js',
                       'js/flashcards/whitleyQuiz.js',
                       filters='jsmin',
                       output='js/flashcards/packedWhitleyQuiz.js')

register('js_whitley_quiz', whitleyQuizJs)

# css

# fileUploaderCss = Bundle('css/aerolith/fileuploader.css',
#                          filters='cssmin',
#                          output='css/aerolith/packedFU.css')

whitleyQuizCss = Bundle('css/flashcards/whitleyQuiz.css',
                        filters='cssmin',
                        output='css/flashcards/packedWhitleyQuiz.css')

register('css_whitley_quiz', whitleyQuizCss)
