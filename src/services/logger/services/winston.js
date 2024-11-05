import winston from "winston";

const myFormat = winston.format.printf((info) => {
  if (info.level.match("debug")) {
    return `[DEBUG] ${info.message}`;
  }

  return `${info.message}`;
});

const customLevels = {
  levels: {
    success: 0,
    error: 1,
    warning: 2,
    notice: 3,
    info: 4,
    debug: 5,
  },
  colors: {
    success: "bold green",
    error: "bold red",
    warning: "bold orange",
    notice: "bold blue",
    info: "grey",
    debug: "dim grey",
  },
};

winston.addColors(customLevels.colors);

export default winston.createLogger({
  levels: customLevels.levels,
  level: "debug",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        myFormat,
        winston.format.colorize({ all: true })
      ),
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
