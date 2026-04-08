import mongoose from "mongoose";
import env from "../config/env.js";
import logger from "../config/logger.js";
import { sendError } from "../utils/response.js";

const formatJoiErrors = (details = []) =>
  details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message.replace(/\"/g, ""),
  }));

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  if (err.isJoi) {
    statusCode = 400;
    message = "Validation failed";
    errors = formatJoiErrors(err.details);
  }

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Mongoose validation failed";
    errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (err?.code === 11000) {
    statusCode = 409;
    message = "Duplicate value detected";
    errors = Object.keys(err.keyPattern || {}).map((key) => ({
      field: key,
      message: `${key} must be unique`,
    }));
  }

  logger.error("Unhandled error", {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    message,
    errors,
    stack: err.stack,
  });

  return sendError(res, {
    statusCode,
    message,
    errors: env.nodeEnv === "production" ? errors : [...errors, { stack: err.stack }],
  });
};

export default errorHandler;
