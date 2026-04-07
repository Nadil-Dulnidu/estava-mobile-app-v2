import logger from "../config/logger.js";

const validate = (schema, property = "body") => async (req, _res, next) => {
  try {
    const value = await schema.validateAsync(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    req[property] = value;
    return next();
  } catch (error) {
    logger.warn("Validation failed", {
      path: req.originalUrl,
      property,
      details: error.details?.map((detail) => detail.message) || [],
    });
    return next(error);
  }
};

export default validate;
