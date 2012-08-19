from django_assets import Bundle, register

# cardboxJs = Bundle('js/aerolith/csrfAjax.js',
#                    'js/aerolith/fileuploader.js',
#                    filters='jsmin',
#                    output='js/flashcards/packed.js')

# register('js_cardbox', cardboxJs)

whitleyQuizJs = Bundle('js/aerolith/csrfAjax.js',
                       'js/flashcards/whitleyQuiz.js',
                       filters='jsmin',
                       output='js/flashcards/packedWhitleyQuiz.js')

register('js_whitley_quiz', whitleyQuizJs)

ikmQuizJs = Bundle('js/flashcards/ikmQuiz.js',
                   filters='jsmin',
                   output='js/flashcards/packedIKMQuiz.js')

register('js_ikm_quiz',
         'js/aerolith/lib/underscore-1.3.3.min.js',
         'js/aerolith/lib/backbone-0.9.2.min.js',
         'js/aerolith/lib/ICanHaz.min.js', ikmQuizJs)


# css

# fileUploaderCss = Bundle('css/aerolith/fileuploader.css',
#                          filters='cssmin',
#                          output='css/aerolith/packedFU.css')

whitleyQuizCss = Bundle('css/flashcards/whitleyQuiz.css',
                        filters='cssmin',
                        output='css/flashcards/packedWhitleyQuiz.css')

register('css_whitley_quiz', whitleyQuizCss)

ikmCss = Bundle('css/flashcards/ikm.css',
                filters='cssmin',
                output='css/flashcards/packedIKM.css')
register('ikm_css', ikmCss)
