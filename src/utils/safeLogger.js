export const logError = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    const sanitized = args.map(arg => {
      if (arg instanceof Error || (arg && typeof arg === 'object')) {
        return `[Error: ${arg.message || 'An object error occurred'}]`;
      }
      return arg;
    });
    globalThis.console?.error?.(...sanitized);
  }
};

export const logWarn = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    const sanitized = args.map(arg => {
      if (arg instanceof Error || (arg && typeof arg === 'object')) {
        return `[Warning: ${arg.message || 'An object warning occurred'}]`;
      }
      return arg;
    });
    globalThis.console?.warn?.(...sanitized);
  }
};
