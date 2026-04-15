import Joi from "joi";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const userIdRegex = /^user_[a-zA-Z0-9]+$/;
const NOTE_MAX_LENGTH = 500;

const noteSchema = Joi.string().trim().max(NOTE_MAX_LENGTH).allow(null, "");

export const createFavoriteSchema = Joi.object({
  propertyId: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
  note: noteSchema,
  priorityLevel: Joi.number().integer().min(1).max(5).allow(null),
  userId: Joi.forbidden(),
});

export const updateFavoriteSchema = Joi.object({
  note: noteSchema,
  priorityLevel: Joi.number().integer().min(1).max(5).allow(null),
  propertyId: Joi.forbidden(),
  userId: Joi.forbidden(),
}).min(1);

export const updateFavoriteNoteSchema = Joi.object({
  note: noteSchema.required(),
  propertyId: Joi.forbidden(),
  userId: Joi.forbidden(),
  priorityLevel: Joi.forbidden(),
});

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
