from django_assets import Bundle, register
            
tableJs = Bundle('js/aerolith/csrfAjax.js',
                'js/crosswordgame/table.js',
                filters = 'jsmin', 
                output='js/crosswordgame/packedTable.js')
            
register('js_crosswordgame_table',
        'js/aerolith/jquery-1.6.1.min.js',
        'js/aerolith/raphael-min.js', tableJs)


# css

# tableCreateCss = Bundle('css/wordgrids/createTable.css',
#                         filters='cssmin',
#                         output='css/wordgrids/packedCreateTable.css')
#        
# tableCss = Bundle('css/wordgrids/table.css',
#                     filters='cssmin',
#                     output='css/wordgrids/packedTable.css')
#         
# register('css_wordgrids_table_create', tableCreateCss)
# register('css_wordgrids_table', tableCss)