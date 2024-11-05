import winston from "winston";

const myFormat = winston.format.printf((info) => info.message);

const customLevels = {
  levels: {
    success: 0,
    error: 1,
    warn: 2,
    notice: 3,
    info: 4,
    progress: 5,
    debug: 6,
  },
};

export default winston.createLogger({
  levels: customLevels.levels,
  level: "debug",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(myFormat),
    }),
    new winston.transports.File({
      filename: "jxl-convert.log",
      level: "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
      ),
    }),
  ],
});
