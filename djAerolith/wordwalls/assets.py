from django.conf import settings
from django_assets import Bundle, register

LIBRARIES = {
    'backbone': 'lib/backbone-min.js',
    'underscore': 'lib/underscore-min.js',
}

if settings.DEBUG:
    # use minified JS libraries
    LIBRARIES['backbone'] = 'lib/backbone-0.9.9.js'
    LIBRARIES['underscore'] = 'lib/underscore-1.4.3.js'

# javascript

# tableCreateJs = Bundle('js/aerolith/csrfAjax.js',
#                         #'js/wordwalls/challengeInfoProcess.js',
#                         'js/wordwalls/tableCreate.js',
#                         'js/aerolith/fileuploader.js',
#                         filters='jsmin',
#                         output='js/wordwalls/packedTableCreate.js')

# tableJs = Bundle('js/aerolith/csrfAjax.js',
#                 'js/aerolith/json2.js',
#                 'js/wordwalls/table.js',
#                 'js/wordwalls/challengeInfoProcess.js',
#                 'js/wordwalls/models/Question.js',
#                 'js/wordwalls/views/QuestionView.js',
#                 'js/wordwalls/models/Configure.js',
#                 'js/wordwalls/views/ConfigureView.js',
#                 'js/wordwalls/views/AppView.js',
#                 'js/wordwalls/models/WordwallsGame.js',
#                 'js/wordwalls/views/WordSolutionView.js',
#                 'js/wordwalls/tableTests.js',
#                 filters='jsmin',
#                 output='js/wordwalls/packedTable.js')

# register('js_table_create', 'js/aerolith/socket.io.min.js', tableCreateJs)

# css

tableCreateCss = Bundle('css/wordwalls/wordwallsCreateTable.css',
                        filters='cssmin',
                        output='css/wordwalls/packedWWCT.css')

fileUploaderCss = Bundle('css/aerolith/fileuploader.css',
                        filters='cssmin',
                        output='css/aerolith/packedFU.css')

tableCss = Bundle('css/wordwalls/wordwallsTableSS.css',
                    filters='cssmin',
                    output='css/wordwalls/packedWWT.css')

register('css_table_create', tableCreateCss)
register('css_table','stars/jquery.ui.stars.min.css', tableCss)
register('css_fileuploader', fileUploaderCss)