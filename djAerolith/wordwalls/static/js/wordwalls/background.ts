type BackgroundOption =
  | ''
  | 'pool_table'
  | 'canvas'
  | 'pink_rice'
  | 'scribble_light'
  | 'cork_wallet'
  | 'hexellence'
  | 'black_linen'
  | 'double_bubble_dark'
  | 'moroccan_flower_dark';

interface BackgroundItem {
  value: string;
  displayValue: string;
}

/**
 * Return a url string that can be given to a style.
 */
function backgroundURL(option: BackgroundOption): string {
  let backgroundImageUrl: string;
  if (option === '') {
    backgroundImageUrl = '';
  } else {
    const backgroundMap: Record<Exclude<BackgroundOption, ''>, string> = {
      pool_table: '/static/img/wordwalls/table_noborder.png',
      canvas: '/static/img/wordwalls/canvas.png',
      pink_rice: '/static/img/aerolith/pink_rice.png',
      scribble_light: '/static/img/aerolith/scribble_light.png',
      cork_wallet: '/static/img/aerolith/cork-wallet.png',
      hexellence: '/static/img/aerolith/hexellence.png',
      black_linen: '/static/img/wordwalls/black-Linen.png',
      double_bubble_dark: '/static/img/wordwalls/double-bubble-dark.png',
      moroccan_flower_dark: '/static/img/wordwalls/moroccan-flower-dark.png',
    };
    backgroundImageUrl = backgroundMap[option];
  }
  return `url("${backgroundImageUrl}")`;
}

const darkBackgrounds = new Set<string>(['black_linen', 'double_bubble_dark', 'moroccan_flower_dark']);
const lightBackgrounds = new Set<string>(['pool_table', 'canvas', 'pink_rice', 'scribble_light', 'cork_wallet', 'hexellence']);
const allBackgrounds = new Set([
  ...darkBackgrounds,
  ...lightBackgrounds,
]);

/**
 * Get a suitable background for the current mode
 */
function getAppropriateBackground(
  currentBackground: string,
  darkMode: boolean,
  isBodyBackground = false,
): string {
  if (darkMode && !darkBackgrounds.has(currentBackground)) {
    // Switch to a dark background when dark mode is enabled
    return isBodyBackground ? 'black_linen' : 'black_linen';
  }
  if (!darkMode && darkBackgrounds.has(currentBackground)) {
    // Switch to a light background when dark mode is disabled
    return isBodyBackground ? 'hexellence' : 'pool_table';
  }
  // For the empty background (''), we still want to return it as-is,
  // letting the caller decide whether to use a default value
  return currentBackground;
}

/**
 * Get display name for a background
 */
function getBackgroundDisplayName(bg: string): string {
  const displayNames: Record<string, string> = {
    '': 'None',
    pool_table: 'Green table',
    canvas: 'Canvas (subtlepatterns.com, CC BY-SA 3.0)',
    pink_rice: 'Pink rice (subtlepatterns.com, CC BY-SA 3.0)',
    scribble_light: 'Scribble light (subtlepatterns.com, CC BY-SA 3.0)',
    cork_wallet: 'Cork wallet (subtlepatterns.com, CC BY-SA 3.0)',
    hexellence: 'Hexellence (subtlepatterns.com, CC BY-SA 3.0)',
    black_linen: 'Black Linen (subtlepatterns.com, CC BY-SA 3.0)',
    double_bubble_dark: 'Double Bubble Dark (subtlepatterns.com, CC BY-SA 3.0)',
    moroccan_flower_dark:
      'Moroccan Flower Dark (subtlepatterns.com, CC BY-SA 3.0)',
  };
  return displayNames[bg] || bg;
}

/**
 * Get background options filtered by mode
 */
function getBackgroundsByMode(darkMode: boolean, isBodyBackground = false): BackgroundItem[] {
  // Use the appropriate set of backgrounds
  if (!isBodyBackground) {
    const backgroundList = Array.from(allBackgrounds);
    backgroundList.unshift(''); // Add empty option for no background
    return backgroundList.map((bg) => ({
      value: bg,
      displayValue: getBackgroundDisplayName(bg),
    }));
  }
  const availableBackgrounds = darkMode ? darkBackgrounds : lightBackgrounds;
  const backgroundList = Array.from(availableBackgrounds);
  // see question_test.jsx for the reason we don't add an empty option here
  return backgroundList.map((bg) => ({
    value: bg,
    displayValue: getBackgroundDisplayName(bg),
  }));
}

export default backgroundURL;

export type { BackgroundOption };
export {
  darkBackgrounds,
  lightBackgrounds,
  getAppropriateBackground,
  getBackgroundsByMode,
};
