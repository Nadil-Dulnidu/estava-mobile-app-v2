import logger from "../config/logger.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import Appointment from "../models/appointment.model.js";
import Property from "../models/property.model.js";
import { createNotificationForUser } from "./notification.service.js";
import AppError from "../utils/AppError.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;

const isAdminRole = (role) => role === USER_ROLES.ADMIN;

const sanitizeAppointmentPayload = (payload = {}) => {
  const next = {};

  if (Object.hasOwn(payload, "appointmentDateTime")) {
    next.appointmentDateTime = new Date(payload.appointmentDateTime);
  }

  if (Object.hasOwn(payload, "visitPurpose")) {
    next.visitPurpose = payload.visitPurpose?.trim() || null;
  }

  if (Object.hasOwn(payload, "notes")) {
    next.notes = payload.notes?.trim() || null;
  }

  if (Object.hasOwn(payload, "appointmentStatus")) {
    next.appointmentStatus = payload.appointmentStatus;
  }

  return next;
};

const ensureAuthenticatedActor = (actorId) => {
  if (!actorId || !userIdRegex.test(actorId)) {
    throw new AppError("Authenticated user id is required", 401);
  }
};

const ensureUserId = (userId, label = "user id") => {
  if (!userIdRegex.test(userId)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

const ensureFutureDateTime = (when) => {
  if (!when || Number.isNaN(new Date(when).getTime())) {
    throw new AppError("Invalid appointment date time", 400);
  }

  if (new Date(when).getTime() <= Date.now()) {
    throw new AppError("Appointment date time must be in the future", 400);
  }
};

const ensureRelevantAccess = (appointment, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  const isOwner = appointment.userId === actorId;
  const isAgent = appointment.agentId === actorId;

  if (!isOwner && !isAgent) {
    throw new AppError("You are not authorized to access this appointment", 403);
  }
};

const ensureListIdentityAccess = (requestedUserId, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  if (requestedUserId && requestedUserId !== actorId) {
    throw new AppError("You are not authorized to view these appointments", 403);
  }
};

const sanitizePatchForActor = (payload, appointment, actorId, actorRole) => {
  if (isAdminRole(actorRole)) {
    return sanitizeAppointmentPayload(payload);
  }

  const isOwner = appointment.userId === actorId;
  const isAgent = appointment.agentId === actorId;
  const sanitized = sanitizeAppointmentPayload(payload);

  if (isOwner && isAgent) {
    return sanitized;
  }

  if (isOwner) {
    const allowed = {};
    if (Object.hasOwn(sanitized, "appointmentDateTime")) {
      allowed.appointmentDateTime = sanitized.appointmentDateTime;
    }
    if (Object.hasOwn(sanitized, "visitPurpose")) allowed.visitPurpose = sanitized.visitPurpose;
    if (Object.hasOwn(sanitized, "notes")) allowed.notes = sanitized.notes;

    if (Object.hasOwn(sanitized, "appointmentStatus")) {
      if (sanitized.appointmentStatus !== "cancelled") {
        throw new AppError("Users can only change status to cancelled", 400);
      }
      allowed.appointmentStatus = sanitized.appointmentStatus;
    }

    return allowed;
  }

  if (isAgent) {
    const allowed = {};
    if (Object.hasOwn(sanitized, "notes")) allowed.notes = sanitized.notes;
    if (Object.hasOwn(sanitized, "appointmentStatus")) {
      allowed.appointmentStatus = sanitized.appointmentStatus;
    }
    return allowed;
  }

  return {};
};

const findPropertyByIdOrThrow = async (propertyId) => {
  const property = await Property.findById(propertyId).select("_id createdBy");

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  return property;
};

const findAppointmentByIdOrThrow = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate("propertyId");

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};

const ensureNoConflictingBooking = async (
  userId,
  propertyId,
  appointmentDateTime,
  excludeId = null
) => {
  const filter = {
    userId,
    propertyId,
    appointmentDateTime,
    appointmentStatus: { $ne: "cancelled" },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const conflict = await Appointment.exists(filter);

  if (conflict) {
    throw new AppError(
      "You already have an appointment for this property at the selected time",
      409
    );
  }
};

const buildListFilter = (query, actorId, actorRole) => {
  const filter = {};

  if (query.propertyId) filter.propertyId = query.propertyId;
  if (query.appointmentStatus) filter.appointmentStatus = query.appointmentStatus;

  if (isAdminRole(actorRole)) {
    if (query.userId) filter.userId = query.userId;
    if (query.agentId) filter.agentId = query.agentId;
    return filter;
  }

  if (query.userId) ensureListIdentityAccess(query.userId, actorId, actorRole);
  if (query.agentId) ensureListIdentityAccess(query.agentId, actorId, actorRole);

  if (query.userId) {
    filter.userId = query.userId;
    return filter;
  }

  if (query.agentId) {
    filter.agentId = query.agentId;
    return filter;
  }

  filter.$or = [{ userId: actorId }, { agentId: actorId }];
  return filter;
};

export const createAppointment = async (payload, actorId) => {
  ensureAuthenticatedActor(actorId);
  const sanitized = sanitizeAppointmentPayload(payload);

  ensureFutureDateTime(sanitized.appointmentDateTime);

  const property = await findPropertyByIdOrThrow(payload.propertyId);
  const agentId = property.createdBy;

  ensureUserId(agentId, "agent id");

  await ensureNoConflictingBooking(
    actorId,
    payload.propertyId,
    sanitized.appointmentDateTime
  );

  try {
    const appointment = await Appointment.create({
      ...sanitized,
      propertyId: property._id,
      userId: actorId,
      agentId,
    });

    await createNotificationForUser(
      {
        title: "New appointment booking",
        message: "A new visit appointment was booked for your property",
        type: "appointment",
        status: "unread",
        relatedEntityId: appointment._id,
        relatedEntityType: "appointment",
      },
      agentId
    );

    return appointment;
  } catch (error) {
    logger.error("Appointment create failed", {
      actorId,
      propertyId: payload.propertyId,
      appointmentDateTime: payload.appointmentDateTime,
      message: error.message,
    });
    throw error;
  }
};

export const listAppointments = async (query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: sortDirection };
  const filter = buildListFilter(query, actorId, actorRole);

  const [items, total] = await Promise.all([
    Appointment.find(filter).sort(sort).skip(skip).limit(limit).populate("propertyId"),
    Appointment.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAppointmentById = async (appointmentId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const appointment = await findAppointmentByIdOrThrow(appointmentId);
  ensureRelevantAccess(appointment, actorId, actorRole);

  return appointment;
};

export const getAppointmentsByAgent = async (agentId, query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);
  ensureUserId(agentId, "agent id");
  ensureListIdentityAccess(agentId, actorId, actorRole);

  return listAppointments({ ...query, agentId }, actorId, actorRole);
};

export const updateAppointment = async (appointmentId, payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const appointment = await findAppointmentByIdOrThrow(appointmentId);
  ensureRelevantAccess(appointment, actorId, actorRole);

  const sanitized = sanitizePatchForActor(payload, appointment, actorId, actorRole);

  if (Object.keys(sanitized).length === 0) {
    throw new AppError("No allowed fields to update for this user", 400);
  }

  if (Object.hasOwn(sanitized, "appointmentDateTime")) {
    ensureFutureDateTime(sanitized.appointmentDateTime);
  }

  const nextDateTime = Object.hasOwn(sanitized, "appointmentDateTime")
    ? sanitized.appointmentDateTime
    : appointment.appointmentDateTime;

  const nextStatus = Object.hasOwn(sanitized, "appointmentStatus")
    ? sanitized.appointmentStatus
    : appointment.appointmentStatus;

  if (nextStatus !== "cancelled") {
    await ensureNoConflictingBooking(
      appointment.userId,
      appointment.propertyId,
      nextDateTime,
      appointment._id
    );
  }

  Object.assign(appointment, sanitized);

  try {
    await appointment.save();

    const counterpartUserId =
      appointment.userId === actorId ? appointment.agentId : appointment.userId;

    if (counterpartUserId) {
      await createNotificationForUser(
        {
          title: "Appointment updated",
          message: `Appointment is now ${appointment.appointmentStatus}`,
          type: "appointment",
          status: "unread",
          relatedEntityId: appointment._id,
          relatedEntityType: "appointment",
        },
        counterpartUserId
      );
    }

    return appointment;
  } catch (error) {
    logger.error("Appointment update failed", {
      actorId,
      appointmentId,
      message: error.message,
    });
    throw error;
  }
};

export const updateAppointmentStatus = async (
  appointmentId,
  appointmentStatus,
  actorId,
  actorRole
) => updateAppointment(appointmentId, { appointmentStatus }, actorId, actorRole);

export const deleteAppointment = async (appointmentId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const appointment = await findAppointmentByIdOrThrow(appointmentId);
  ensureRelevantAccess(appointment, actorId, actorRole);

  try {
    const counterpartUserId =
      appointment.userId === actorId ? appointment.agentId : appointment.userId;

    await appointment.deleteOne();

    if (counterpartUserId) {
      await createNotificationForUser(
        {
          title: "Appointment cancelled",
          message: "An appointment related to your listing/request was cancelled",
          type: "appointment",
          status: "unread",
          relatedEntityId: appointment._id,
          relatedEntityType: "appointment",
        },
        counterpartUserId
      );
    }
  } catch (error) {
    logger.error("Appointment delete failed", {
      actorId,
      appointmentId,
      message: error.message,
    });
    throw error;
  }
};
