import logger from "../config/logger.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import Notification from "../models/notification.model.js";
import AppError from "../utils/AppError.js";
import { emitToUserRoom } from "../sockets/socket.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;

const isAdminRole = (role) => role === USER_ROLES.ADMIN;

const sanitizeNotificationPayload = (payload = {}) => {
  const next = {};

  if (Object.hasOwn(payload, "title")) {
    next.title = payload.title?.trim();
  }

  if (Object.hasOwn(payload, "message")) {
    next.message = payload.message?.trim();
  }

  if (Object.hasOwn(payload, "type")) {
    next.type = payload.type;
  }

  if (Object.hasOwn(payload, "status")) {
    next.status = payload.status;
  }

  if (Object.hasOwn(payload, "relatedEntityId")) {
    next.relatedEntityId = payload.relatedEntityId || null;
  }

  if (Object.hasOwn(payload, "relatedEntityType")) {
    next.relatedEntityType = payload.relatedEntityType?.trim().toLowerCase() || null;
  }

  return next;
};

const ensureAuthenticatedActor = (actorId) => {
  if (!actorId || !userIdRegex.test(actorId)) {
    throw new AppError("Authenticated user id is required", 401);
  }
};

const ensureUserId = (userId) => {
  if (!userIdRegex.test(userId)) {
    throw new AppError("Invalid user id", 400);
  }
};

const ensureOwnerOrAdmin = (notification, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  if (notification.userId !== actorId) {
    throw new AppError("You are not authorized to access this notification", 403);
  }
};

const ensureUserListAccess = (requestedUserId, actorId, actorRole) => {
  if (!requestedUserId) return;
  if (isAdminRole(actorRole)) return;

  if (requestedUserId !== actorId) {
    throw new AppError("You are not authorized to view these notifications", 403);
  }
};

const findNotificationByIdOrThrow = async (notificationId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
};

const buildListFilter = (query, actorId, actorRole) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.relatedEntityId) filter.relatedEntityId = query.relatedEntityId;
  if (query.relatedEntityType) {
    filter.relatedEntityType = query.relatedEntityType.toLowerCase();
  }

  ensureUserListAccess(query.userId, actorId, actorRole);

  if (isAdminRole(actorRole)) {
    if (query.userId) filter.userId = query.userId;
    return filter;
  }

  filter.userId = query.userId || actorId;
  return filter;
};

export const createNotification = async (payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const sanitized = sanitizeNotificationPayload(payload);
  const targetUserId = actorId;

  ensureUserId(targetUserId);

  try {
    const notification = await Notification.create({
      ...sanitized,
      userId: targetUserId,
    });

    emitToUserRoom(targetUserId, "notification:new", {
      success: true,
      data: notification,
    });

    return notification;
  } catch (error) {
    logger.error("Notification create failed", {
      actorId,
      targetUserId,
      message: error.message,
    });
    throw error;
  }
};

export const listNotifications = async (query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: sortDirection };
  const filter = buildListFilter(query, actorId, actorRole);

  const [items, total] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(limit),
    Notification.countDocuments(filter),
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

export const getNotificationById = async (notificationId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const notification = await findNotificationByIdOrThrow(notificationId);
  ensureOwnerOrAdmin(notification, actorId, actorRole);

  return notification;
};

export const getNotificationsByUser = async (userId, query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);
  ensureUserId(userId);
  ensureUserListAccess(userId, actorId, actorRole);

  return listNotifications({ ...query, userId }, actorId, actorRole);
};

export const updateNotification = async (notificationId, payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const notification = await findNotificationByIdOrThrow(notificationId);
  ensureOwnerOrAdmin(notification, actorId, actorRole);

  const sanitized = sanitizeNotificationPayload(payload);
  Object.assign(notification, sanitized);

  try {
    await notification.save();
    return notification;
  } catch (error) {
    logger.error("Notification update failed", {
      actorId,
      notificationId,
      message: error.message,
    });
    throw error;
  }
};

export const markNotificationReadState = async (
  notificationId,
  status,
  actorId,
  actorRole
) => updateNotification(notificationId, { status }, actorId, actorRole);

export const deleteNotification = async (notificationId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const notification = await findNotificationByIdOrThrow(notificationId);
  ensureOwnerOrAdmin(notification, actorId, actorRole);

  try {
    await notification.deleteOne();
  } catch (error) {
    logger.error("Notification delete failed", {
      actorId,
      notificationId,
      message: error.message,
    });
    throw error;
  }
};
