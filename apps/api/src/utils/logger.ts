export const logger = {
  info: (message: string, meta?: unknown) => {
    if (meta) {
      console.info(message, meta);
      return;
    }

    console.info(message);
  },
  warn: (message: string, meta?: unknown) => {
    if (meta) {
      console.warn(message, meta);
      return;
    }

    console.warn(message);
  },
  error: (message: string, meta?: unknown) => {
    if (meta) {
      console.error(message, meta);
      return;
    }

    console.error(message);
  }
};
