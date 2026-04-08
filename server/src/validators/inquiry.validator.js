import Joi from "joi";
import { INQUIRY_STATUSES } from "../constants/inquiry.constants.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const userIdRegex = /^user_[a-zA-Z0-9]+$/;

export const createInquirySchema = Joi.object({
  propertyId: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
  subject: Joi.string().trim().min(1).max(160).allow(null, ""),
  message: Joi.string().trim().min(1).max(4000).required(),
  contactNumber: Joi.string().trim().min(3).max(30).allow(null, ""),
  inquiryStatus: Joi.forbidden(),
  senderUserId: Joi.forbidden(),
  receiverUserId: Joi.forbidden(),
});

export const updateInquirySchema = Joi.object({
  subject: Joi.string().trim().min(1).max(160).allow(null, ""),
  message: Joi.string().trim().min(1).max(4000),
  contactNumber: Joi.string().trim().min(3).max(30).allow(null, ""),
  inquiryStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...INQUIRY_STATUSES),
  propertyId: Joi.forbidden(),
  senderUserId: Joi.forbidden(),
  receiverUserId: Joi.forbidden(),
}).min(1);

export const updateInquiryStatusSchema = Joi.object({
  inquiryStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...INQUIRY_STATUSES)
    .required(),
});

export const inquiryIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid inquiry id",
  }),
});

export const inquiryUserIdParamSchema = Joi.object({
  id: Joi.string().pattern(userIdRegex).required().messages({
    "string.pattern.base": "Invalid user id",
  }),
});

export const listInquiriesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  propertyId: Joi.string().pattern(objectIdRegex).messages({
    "string.pattern.base": "Invalid property id",
  }),
  senderUserId: Joi.string().pattern(userIdRegex).messages({
    "string.pattern.base": "Invalid sender user id",
  }),
  receiverUserId: Joi.string().pattern(userIdRegex).messages({
    "string.pattern.base": "Invalid receiver user id",
  }),
  inquiryStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...INQUIRY_STATUSES),
});
