import Joi from "joi";
import { PROPERTY_MODERATION_STATUSES } from "../constants/property.constants.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const dashboardSummaryQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
});

export const moderationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "price", "title").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  moderationStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_MODERATION_STATUSES),
  propertyType: Joi.string().trim().lowercase(),
  listingType: Joi.string().trim().lowercase(),
  search: Joi.string().trim().max(120).allow(""),
});

export const adminPropertyIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
});

export const moderatePropertySchema = Joi.object({
  moderationStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_MODERATION_STATUSES)
    .required(),
  moderationNote: Joi.string().trim().max(500).allow(null, ""),
});
