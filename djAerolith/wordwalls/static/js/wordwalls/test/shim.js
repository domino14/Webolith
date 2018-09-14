// Shim requestAnimationFrame to get rid of a warning.
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};
