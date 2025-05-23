import winston from "winston";

// Determine if running offline/locally
const isOffline =
  process.env.IS_OFFLINE === "1" || process.env.IS_OFFLINE === "true";

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: { service: "home-iot-backend" },
  transports: [
    new winston.transports.Console({
      format: isOffline
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(
              ({ level, message, timestamp, ...metadata }) => {
                return `${timestamp} ${level}: ${message} ${
                  Object.keys(metadata).length ? JSON.stringify(metadata) : ""
                }`;
              }
            )
          )
        : winston.format.json(), // Use JSON in production for CloudWatch
    }),
  ],
});

const contextLogger = {
  ...logger,
  withContext: (context: Record<string, any>) => {
    return {
      info: (message: string, meta = {}) =>
        logger.info(message, { ...context, ...meta }),
      warn: (message: string, meta = {}) =>
        logger.warn(message, { ...context, ...meta }),
      error: (message: string, meta = {}) =>
        logger.error(message, { ...context, ...meta }),
      debug: (message: string, meta = {}) =>
        logger.debug(message, { ...context, ...meta }),
    };
  },
};

export default contextLogger;
