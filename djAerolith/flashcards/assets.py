from django_assets import Bundle, register

cardboxJs = Bundle('js/aerolith/csrfAjax.js',
                   'js/aerolith/fileuploader.js',
                   filters='jsmin',
                   output='js/flashcards/packed.js')

register('js_cardbox', cardboxJs)

# css

fileUploaderCss = Bundle('css/aerolith/fileuploader.css',
                         filters='cssmin',
                         output='css/aerolith/packedFU.css')
