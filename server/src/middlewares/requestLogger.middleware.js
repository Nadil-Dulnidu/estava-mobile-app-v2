import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    const payload = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userId: req.user?.id || req.user?._id || null,
    };

    if (res.statusCode >= 500) {
      logger.error("Request completed with server error", payload);
    } else if (res.statusCode >= 400) {
      logger.warn("Request completed with client error", payload);
    } else {
      logger.info("Request completed", payload);
    }
  });

  next();
};

export default requestLogger;
