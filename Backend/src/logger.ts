import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      level: "info",
      format: format.simple(),
    }),
    new transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],
});

export default logger;
