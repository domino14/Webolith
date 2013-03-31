from django_assets import Bundle, register

baseCss = Bundle('css/aerolith/aerolithStyleSheet.css',
                'css/blog/blogStyles.css',
                filters='cssmin',
                output='css/aerolith/packedBaseSS.css')

jqueryCss = Bundle('css/redmond/jquery-ui-1.10.2.custom.css',
                    filters='cssmin',
                    output='css/redmond/packedJQUI.css')


register('base_css', baseCss)
register('jquery_css', jqueryCss)

register('js_jquery', 'js/aerolith/jquery-1.9.1.min.js',
                        'js/aerolith/jquery-ui-1.10.2.custom.min.js')