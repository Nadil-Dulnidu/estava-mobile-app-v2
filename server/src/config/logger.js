import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import winston from "winston";
import env from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, "../../logs");

mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "property-service" },
  transports: [
    new winston.transports.Console({
      format:
        env.nodeEnv === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp(),
              winston.format.printf(
                ({ level, message, timestamp, ...meta }) =>
                  `${timestamp} [${level}] ${message} ${
                    Object.keys(meta).length ? JSON.stringify(meta) : ""
                  }`
              )
            )
          : winston.format.json(),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
  ],
});

export default logger;
