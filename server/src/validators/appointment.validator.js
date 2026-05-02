import Joi from "joi";
import { APPOINTMENT_STATUSES } from "../constants/appointment.constants.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const userIdRegex = /^user_[a-zA-Z0-9]+$/;

const appointmentDateTimeSchema = Joi.date().iso().required().messages({
  "date.base": "appointmentDateTime must be a valid ISO date",
  "date.format": "appointmentDateTime must be a valid ISO date",
});

export const createAppointmentSchema = Joi.object({
  propertyId: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
  appointmentDateTime: appointmentDateTimeSchema,
  visitPurpose: Joi.string().trim().min(1).max(200).allow(null, ""),
  notes: Joi.string().trim().min(1).max(1000).allow(null, ""),
  appointmentStatus: Joi.forbidden(),
  userId: Joi.forbidden(),
  agentId: Joi.forbidden(),
}).custom((value, helpers) => {
  const when = new Date(value.appointmentDateTime);

  if (Number.isNaN(when.getTime())) {
    return helpers.error("any.invalid", {
      message: "appointmentDateTime must be a valid date",
    });
  }

  if (when.getTime() <= Date.now()) {
    return helpers.error("any.invalid", {
      message: "appointmentDateTime must be in the future",
    });
  }

  return value;
});

export const updateAppointmentSchema = Joi.object({
  appointmentDateTime: Joi.date().iso(),
  visitPurpose: Joi.string().trim().min(1).max(200).allow(null, ""),
  notes: Joi.string().trim().min(1).max(1000).allow(null, ""),
  appointmentStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...APPOINTMENT_STATUSES),
  propertyId: Joi.forbidden(),
  userId: Joi.forbidden(),
  agentId: Joi.forbidden(),
}).min(1);

export const updateAppointmentStatusSchema = Joi.object({
  appointmentStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...APPOINTMENT_STATUSES)
    .required(),
});

export const appointmentIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid appointment id",
  }),
});

export const appointmentAgentIdParamSchema = Joi.object({
  id: Joi.string().pattern(userIdRegex).required().messages({
    "string.pattern.base": "Invalid agent id",
  }),
});

export const listAppointmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "appointmentDateTime").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  propertyId: Joi.string().pattern(objectIdRegex).messages({
    "string.pattern.base": "Invalid property id",
  }),
  userId: Joi.string().pattern(userIdRegex).messages({
    "string.pattern.base": "Invalid user id",
  }),
  agentId: Joi.string().pattern(userIdRegex).messages({
    "string.pattern.base": "Invalid agent id",
  }),
  appointmentStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...APPOINTMENT_STATUSES),
});
