
/**
 * Return a url string that can be given to a style.
 * @param {string} option The name of a background.
 */
function backgroundURL(option) {
  let backgroundImageUrl;
  if (option === '') {
    backgroundImageUrl = '';
  } else {
    backgroundImageUrl = {
      pool_table: '/static/img/wordwalls/table_noborder.png',
      canvas: '/static/img/wordwalls/canvas.png',
      pink_rice: '/static/img/aerolith/pink_rice.png',
      scribble_light: '/static/img/aerolith/scribble_light.png',
      cork_wallet: '/static/img/aerolith/cork-wallet.png',
      hexellence: '/static/img/aerolith/hexellence.png',
      black_linen: '/static/img/wordwalls/black-Linen.png',
    }[option];
  }
  return `url("${backgroundImageUrl}")`;
}


export default backgroundURL;

