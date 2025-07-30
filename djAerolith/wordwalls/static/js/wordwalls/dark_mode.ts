// Bootstrap 5 Native Dark Mode Utilities

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

/**
 * Sets the theme using Bootstrap 5's native data-bs-theme attribute
 */
function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-bs-theme', theme);
}

/**
 * Gets the current theme from the data-bs-theme attribute
 */
function getCurrentTheme(): 'light' | 'dark' {
  const theme = document.documentElement.getAttribute('data-bs-theme');
  return theme === 'dark' ? 'dark' : 'light';
}

/**
 * Toggles between light and dark themes
 */
function toggleTheme(): 'light' | 'dark' {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}

export { 
  detectDarkModePreference, 
  addDarkModeChangeListener,
  setTheme,
  getCurrentTheme,
  toggleTheme
};
