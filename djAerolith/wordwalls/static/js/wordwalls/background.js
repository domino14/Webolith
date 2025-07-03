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
      double_bubble_dark: '/static/img/wordwalls/double-bubble-dark.png',
      moroccan_flower_dark: '/static/img/wordwalls/moroccan-flower-dark.png',
    }[option];
  }
  return `url("${backgroundImageUrl}")`;
}
const darkBackgrounds = new Set(['black_linen', 'double_bubble_dark', 'moroccan_flower_dark']);

/**
 * Get a suitable background for the current mode
 * @param {string} currentBackground The currently selected background
 * @param {boolean} darkMode Whether dark mode is enabled
 * @returns {string} The background to use
 */
function getAppropriateBackground(currentBackground, darkMode) {
  if (darkMode && !darkBackgrounds.has(currentBackground)) {
    // Switch to a dark background when dark mode is enabled
    return 'black_linen';
  }
  if (!darkMode && darkBackgrounds.has(currentBackground)) {
    // Switch to a light background when dark mode is disabled
    return 'hexellence';
  }
  return currentBackground;
}

export default backgroundURL;

export { darkBackgrounds, getAppropriateBackground };
