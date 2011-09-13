from django_assets import Bundle, register

flashcardJs = Bundle('js/aerolith/csrfAjax.js',
                'js/whitleyCards/quiz.js',
                filters = 'jsmin', 
                output='js/whitleyCards/packedFlashcards.js')
            
register('js_quiz', flashcardJs)