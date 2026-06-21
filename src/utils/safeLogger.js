export const logError = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    const sanitized = args.map(arg => {
      if (arg && typeof arg === 'object') {
        const copy = { ...arg };
        if (copy[ 'config' ]) delete copy[ 'config' ];
        if (copy[ 'request' ]) delete copy[ 'request' ];
        if (copy[ 'headers' ]) delete copy[ 'headers' ];
        return copy;
      }
      return arg;
    });
    globalThis.console?.error?.(...sanitized);
  }
};

export const logWarn = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    const sanitized = args.map(arg => {
      if (arg && typeof arg === 'object') {
        const copy = { ...arg };
        if (copy[ 'config' ]) delete copy[ 'config' ];
        if (copy[ 'request' ]) delete copy[ 'request' ];
        if (copy[ 'headers' ]) delete copy[ 'headers' ];
        return copy;
      }
      return arg;
    });
    globalThis.console?.warn?.(...sanitized);
  }
};
