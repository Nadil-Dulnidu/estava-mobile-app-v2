import Joi from "joi";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const userIdRegex = /^user_[a-zA-Z0-9]+$/;

export const createFavoriteSchema = Joi.object({
  propertyId: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
  note: Joi.string().trim().max(500).allow(null, ""),
  priorityLevel: Joi.number().integer().min(1).max(5).allow(null),
  userId: Joi.forbidden(),
});

export const updateFavoriteSchema = Joi.object({
  note: Joi.string().trim().max(500).allow(null, ""),
  priorityLevel: Joi.number().integer().min(1).max(5).allow(null),
  propertyId: Joi.forbidden(),
  userId: Joi.forbidden(),
}).min(1);

export const favoriteIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid favorite id",
  }),
});

export const favoriteUserIdParamSchema = Joi.object({
  id: Joi.string().pattern(userIdRegex).required().messages({
    "string.pattern.base": "Invalid user id",
  }),
});
