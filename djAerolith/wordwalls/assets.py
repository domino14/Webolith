from django_assets import Bundle, register

tableCss = Bundle('css/wordwalls/wordwallsTableSS.css',
                  filters='cssmin',
                  output='css/wordwalls/packedWWT.css')

register('css_table', tableCss)
