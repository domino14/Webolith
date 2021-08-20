// Shim requestAnimationFrame to get rid of a warning.
import '@babel/polyfill'; // Need polyfill for tests to pass.

global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};
