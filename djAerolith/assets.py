from django_assets import Bundle, register

aerolithCss = Bundle('css/aerolith/aerolithStyleSheet.css', 
       filters='cssmin',
       output='css/aerolith/packedASS.css')

blogCss = Bundle('css/blog/blogStyles.css',
        filters='cssmin',
        output='css/blog/packedBS.css')
        
register('aerolith_css', aerolithCss)
register('blog_css', blogCss)