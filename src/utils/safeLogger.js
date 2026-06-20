export const logError = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    globalThis.console?.error?.(...args);
  }
};

export const logWarn = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    globalThis.console?.warn?.(...args);
  }
};
