// Shim requestAnimationFrame to get rid of a warning.
import '@babel/polyfill'; // Need polyfill for tests to pass.

declare global {
  var requestAnimationFrame: (callback: FrameRequestCallback) => void;
}

global.requestAnimationFrame = (callback: FrameRequestCallback): void => {
  setTimeout(callback, 0);
};