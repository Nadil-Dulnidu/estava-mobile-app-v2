import logger from "../config/logger.js";
import * as notificationService from "../services/notification.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActor = (req) => ({
  id: req.user?.id,
  role: req.user?.role || "USER",
});

export const createNotification = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const notification = await notificationService.createNotification(
      req.body,
      actor.id,
      actor.role
    );

    logger.info("Notification created", {
      notificationId: notification._id,
      userId: notification.userId,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Notification create request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      message: error.message,
    });
    throw error;
  }
});

export const getNotifications = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await notificationService.listNotifications(req.query, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Notifications fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const result = await notificationService.clearNotifications(actor.id);

    logger.info("Notifications cleared", {
      actorId: actor.id,
      actorRole: actor.role,
      deletedCount: result.deletedCount,
    });

    return sendSuccess(res, {
      message: "Notifications cleared successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Notification clear request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      message: error.message,
    });
    throw error;
  }
});

export const getNotificationById = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const notification = await notificationService.getNotificationById(
    req.params.id,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Notification fetched successfully",
    data: notification,
  });
});

export const getNotificationsByUser = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await notificationService.getNotificationsByUser(
    req.params.id,
    req.query,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "User notifications fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const updateNotification = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const notification = await notificationService.updateNotification(
      req.params.id,
      req.body,
      actor.id,
      actor.role
    );

    logger.info("Notification updated", {
      notificationId: notification._id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Notification updated successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Notification update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      notificationId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const markNotificationReadState = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const notification = await notificationService.markNotificationReadState(
      req.params.id,
      req.body.status,
      actor.id,
      actor.role
    );

    logger.info("Notification read state updated", {
      notificationId: notification._id,
      status: notification.status,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Notification status updated successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Notification read state update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      notificationId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    await notificationService.deleteNotification(req.params.id, actor.id, actor.role);

    logger.info("Notification deleted", {
      notificationId: req.params.id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Notification deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("Notification delete request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      notificationId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});
