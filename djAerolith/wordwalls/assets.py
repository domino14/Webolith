from django_assets import Bundle, register

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
register('css_table', tableCss)
register('css_fileuploader', fileUploaderCss)
