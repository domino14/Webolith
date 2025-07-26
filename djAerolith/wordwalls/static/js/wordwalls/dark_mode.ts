// This file provides utilities for dark mode preference detection

/**
 * Detects if the user's system prefers dark mode
 */
function detectDarkModePreference(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Sets up a listener for changes in the system's dark mode preference
 */
function addDarkModeChangeListener(callback: (isDark: boolean) => void): () => void {
  if (!window.matchMedia) return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }
  if (mediaQuery.addListener) {
    // Older browsers
    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }

  return () => {};
}

export { detectDarkModePreference, addDarkModeChangeListener };
