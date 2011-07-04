from django_assets import Bundle, register

baseCss = Bundle('css/aerolith/aerolithStyleSheet.css',
                'css/blog/blogStyles.css',
                'css/redmond/jquery-ui-1.8.14.custom.css',
                filters='cssmin',
                output='css/aerolith/packedBaseSS.css')        

register('base_css', baseCss)

register('js_jquery', 'js/aerolith/jquery-1.6.1.min.js', 
                            'js/aerolith/jquery-ui-1.8.14.custom.min.js')