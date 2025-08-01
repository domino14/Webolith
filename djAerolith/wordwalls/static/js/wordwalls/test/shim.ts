// Shim requestAnimationFrame to get rid of a warning.
import '@babel/polyfill'; // Need polyfill for tests to pass.

// Override requestAnimationFrame for tests
(global as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
  setTimeout(callback, 0);
  return 0; // Return a dummy request ID
};