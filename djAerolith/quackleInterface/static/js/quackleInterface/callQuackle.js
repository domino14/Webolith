// get .gcg file
function getGCGFile()
{
    alert($('p:contains("Source data file:")').children('a').attr('href'));
}