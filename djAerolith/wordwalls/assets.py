from django_assets import Bundle, register

# javascript

tableCreateJs = Bundle('js/aerolith/csrfAjax.js', 
                        'js/wordwalls/challengeInfoProcess.js', 
                        'js/wordwalls/tableCreate.js',
                        'js/aerolith/fileuploader.js',
                        filters='jsmin', 
                        output='js/wordwalls/packedTableCreate.js')
            
tableJs = Bundle('js/aerolith/csrfAjax.js',
                'js/aerolith/json2.js',
                'js/wordwalls/challengeInfoProcess.js',
                'js/wordwalls/table.js',
                'js/wordwalls/tableTests.js', 
                filters = 'jsmin', 
                output='js/wordwalls/packedTable.js')
            
register('js_table_create', tableCreateJs)

register('js_table', 'js/aerolith/jquery-1.6.1.min.js', 'js/aerolith/jquery-ui-1.8.14.custom.min.js', 
                        'stars/jquery.ui.stars.min.js', tableJs)

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