// This file provides utilities for dark mode preference detection

/**
 * Detects if the user's system prefers dark mode
 * @returns {boolean} True if the user prefers dark mode
 */
function detectDarkModePreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Sets up a listener for changes in the system's dark mode preference
 * @param {function} callback Function to call when preference changes
 * @returns {function} Function to remove the listener
 */
function addDarkModeChangeListener(callback) {
  if (!window.matchMedia) return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e) => {
    callback(e.matches);
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  } else if (mediaQuery.addListener) {
    // Older browsers
    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }

  return () => {};
}

export { detectDarkModePreference, addDarkModeChangeListener };
