from django_assets import Bundle, register

# javascript

tableCreateJs = Bundle('js/aerolith/csrfAjax.js', 
                        'js/wordgrids/createTable.js',
                        filters='jsmin', 
                        output='js/wordgrids/packedTableCreate.js')
            
tableJs = Bundle('js/aerolith/csrfAjax.js',
                filters = 'jsmin', 
                output='js/wordgrids/packedTable.js')
            
register('js_wordgrids_table_create', tableCreateJs)

register('js_wordgrids_table', 'js/aerolith/jquery-1.6.1.min.js', tableJs)

# css

tableCreateCss = Bundle('css/wordgrids/createTable.css',
                        filters='cssmin',
                        output='css/wordgrids/packedCreateTable.css')
       
tableCss = Bundle('css/wordgrids/table.css',
                    filters='cssmin',
                    output='css/wordgrids/packedTable.css')
        
register('css_wordgrids_table_create', tableCreateCss)
register('css_wordgrids_table', tableCss)