import Joi from "joi";
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from "../constants/review.constants.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const userIdRegex = /^user_[a-zA-Z0-9]+$/;

export const createReviewSchema = Joi.object({
  propertyId: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
  rating: Joi.number().integer().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX).required(),
  comment: Joi.string().trim().min(3).max(2000).allow(null, ""),
  userId: Joi.forbidden(),
  userName: Joi.string().trim().min(1).max(120),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX),
  comment: Joi.string().trim().min(3).max(2000).allow(null, ""),
  propertyId: Joi.forbidden(),
  userId: Joi.forbidden(),
  userName: Joi.forbidden(),
}).min(1);

export const reviewIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid review id",
  }),
});

export const reviewPropertyIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
});

export const listReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "rating").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  propertyId: Joi.string().pattern(objectIdRegex).messages({
    "string.pattern.base": "Invalid property id",
  }),
  userId: Joi.string().pattern(userIdRegex).messages({
    "string.pattern.base": "Invalid user id",
  }),
  minRating: Joi.number().integer().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX),
  maxRating: Joi.number().integer().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX),
}).custom((value, helpers) => {
  if (
    value.minRating !== undefined &&
    value.maxRating !== undefined &&
    value.minRating > value.maxRating
  ) {
    return helpers.error("any.invalid", {
      message: "minRating cannot be greater than maxRating",
    });
  }

  return value;
});
