import Joi from "joi";
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from "../constants/notification.constants.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const userIdRegex = /^user_[a-zA-Z0-9]+$/;

export const createNotificationSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).required(),
  message: Joi.string().trim().min(3).max(2000).required(),
  type: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_TYPES)
    .default("general"),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_STATUSES)
    .default("unread"),
  relatedEntityId: Joi.string().pattern(objectIdRegex).allow(null, "").messages({
    "string.pattern.base": "Invalid related entity id",
  }),
  relatedEntityType: Joi.string().trim().min(2).max(80).allow(null, ""),
  userId: Joi.forbidden(),
});

export const updateNotificationSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160),
  message: Joi.string().trim().min(3).max(2000),
  type: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_TYPES),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_STATUSES),
  relatedEntityId: Joi.string().pattern(objectIdRegex).allow(null, "").messages({
    "string.pattern.base": "Invalid related entity id",
  }),
  relatedEntityType: Joi.string().trim().min(2).max(80).allow(null, ""),
  userId: Joi.forbidden(),
}).min(1);

export const updateNotificationReadSchema = Joi.object({
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_STATUSES)
    .required(),
});

export const notificationIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid notification id",
  }),
});

export const notificationUserIdParamSchema = Joi.object({
  id: Joi.string().pattern(userIdRegex).required().messages({
    "string.pattern.base": "Invalid user id",
  }),
});

export const listNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_STATUSES),
  type: Joi.string()
    .trim()
    .lowercase()
    .valid(...NOTIFICATION_TYPES),
  userId: Joi.string().pattern(userIdRegex).messages({
    "string.pattern.base": "Invalid user id",
  }),
  relatedEntityId: Joi.string().pattern(objectIdRegex).messages({
    "string.pattern.base": "Invalid related entity id",
  }),
  relatedEntityType: Joi.string().trim().min(2).max(80),
});
