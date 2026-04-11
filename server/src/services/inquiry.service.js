import logger from "../config/logger.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import Inquiry from "../models/inquiry.model.js";
import Property from "../models/property.model.js";
import { createNotificationForUser } from "./notification.service.js";
import AppError from "../utils/AppError.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;

const isAdminRole = (role) => role === USER_ROLES.ADMIN;

const sanitizeInquiryPayload = (payload = {}) => {
  const next = {};

  if (Object.hasOwn(payload, "subject")) {
    next.subject = payload.subject?.trim() || null;
  }

  if (Object.hasOwn(payload, "message")) {
    next.message = payload.message?.trim();
  }

  if (Object.hasOwn(payload, "contactNumber")) {
    next.contactNumber = payload.contactNumber?.trim() || null;
  }

  if (Object.hasOwn(payload, "inquiryStatus")) {
    next.inquiryStatus = payload.inquiryStatus;
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

const ensureRelevantAccess = (inquiry, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  const isSender = inquiry.senderUserId === actorId;
  const isReceiver = inquiry.receiverUserId === actorId;

  if (!isSender && !isReceiver) {
    throw new AppError("You are not authorized to access this inquiry", 403);
  }
};

const ensureListIdentityAccess = (requestedUserId, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  if (requestedUserId && requestedUserId !== actorId) {
    throw new AppError("You are not authorized to view these inquiries", 403);
  }
};

const findInquiryByIdOrThrow = async (inquiryId) => {
  const inquiry = await Inquiry.findById(inquiryId).populate("propertyId");

  if (!inquiry) {
    throw new AppError("Inquiry not found", 404);
  }

  return inquiry;
};

const findPropertyByIdOrThrow = async (propertyId) => {
  const property = await Property.findById(propertyId).select("_id createdBy");

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  return property;
};

const sanitizeInquiryPatchForActor = (payload, inquiry, actorId, actorRole) => {
  if (isAdminRole(actorRole)) {
    return sanitizeInquiryPayload(payload);
  }

  const isSender = inquiry.senderUserId === actorId;
  const isReceiver = inquiry.receiverUserId === actorId;
  const sanitized = sanitizeInquiryPayload(payload);

  if (isSender && isReceiver) {
    return sanitized;
  }

  if (isSender) {
    const allowed = {};
    if (Object.hasOwn(sanitized, "subject")) allowed.subject = sanitized.subject;
    if (Object.hasOwn(sanitized, "message")) allowed.message = sanitized.message;
    if (Object.hasOwn(sanitized, "contactNumber")) allowed.contactNumber = sanitized.contactNumber;
    return allowed;
  }

  if (isReceiver) {
    const allowed = {};
    if (Object.hasOwn(sanitized, "inquiryStatus")) {
      allowed.inquiryStatus = sanitized.inquiryStatus;
    }
    return allowed;
  }

  return {};
};

const buildListFilter = (query, actorId, actorRole) => {
  const filter = {};

  if (query.propertyId) filter.propertyId = query.propertyId;
  if (query.inquiryStatus) filter.inquiryStatus = query.inquiryStatus;

  if (isAdminRole(actorRole)) {
    if (query.senderUserId) filter.senderUserId = query.senderUserId;
    if (query.receiverUserId) filter.receiverUserId = query.receiverUserId;
    return filter;
  }

  if (query.senderUserId) ensureListIdentityAccess(query.senderUserId, actorId, actorRole);
  if (query.receiverUserId) ensureListIdentityAccess(query.receiverUserId, actorId, actorRole);

  if (query.senderUserId) {
    filter.senderUserId = query.senderUserId;
    return filter;
  }

  if (query.receiverUserId) {
    filter.receiverUserId = query.receiverUserId;
    return filter;
  }

  filter.$or = [{ senderUserId: actorId }, { receiverUserId: actorId }];
  return filter;
};

export const createInquiry = async (payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const property = await findPropertyByIdOrThrow(payload.propertyId);
  const receiverUserId = property.createdBy;

  ensureUserId(receiverUserId);

  if (!isAdminRole(actorRole) && receiverUserId === actorId) {
    throw new AppError("You cannot send an inquiry to your own property", 400);
  }

  const sanitized = sanitizeInquiryPayload(payload);

  try {
    const inquiry = await Inquiry.create({
      ...sanitized,
      propertyId: property._id,
      senderUserId: actorId,
      receiverUserId,
    });

    await createNotificationForUser(
      {
        title: "New inquiry received",
        message: inquiry.subject
          ? `${inquiry.subject} - You received a new inquiry`
          : "You received a new inquiry on your listing",
        type: "inquiry",
        status: "unread",
        relatedEntityId: inquiry._id,
        relatedEntityType: "inquiry",
      },
      receiverUserId
    );

    return inquiry;
  } catch (error) {
    logger.error("Inquiry create failed", {
      actorId,
      propertyId: payload.propertyId,
      message: error.message,
    });
    throw error;
  }
};

export const listInquiries = async (query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: sortDirection };
  const filter = buildListFilter(query, actorId, actorRole);

  const [items, total] = await Promise.all([
    Inquiry.find(filter).sort(sort).skip(skip).limit(limit).populate("propertyId"),
    Inquiry.countDocuments(filter),
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

export const getInquiryById = async (inquiryId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const inquiry = await findInquiryByIdOrThrow(inquiryId);
  ensureRelevantAccess(inquiry, actorId, actorRole);

  return inquiry;
};

export const getInquiriesByReceiver = async (receiverUserId, query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);
  ensureUserId(receiverUserId);
  ensureListIdentityAccess(receiverUserId, actorId, actorRole);

  return listInquiries({ ...query, receiverUserId }, actorId, actorRole);
};

export const getInquiriesBySender = async (senderUserId, query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);
  ensureUserId(senderUserId);
  ensureListIdentityAccess(senderUserId, actorId, actorRole);

  return listInquiries({ ...query, senderUserId }, actorId, actorRole);
};

export const updateInquiry = async (inquiryId, payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const inquiry = await findInquiryByIdOrThrow(inquiryId);
  ensureRelevantAccess(inquiry, actorId, actorRole);

  const sanitized = sanitizeInquiryPatchForActor(payload, inquiry, actorId, actorRole);

  if (Object.keys(sanitized).length === 0) {
    throw new AppError("No allowed fields to update for this user", 400);
  }

  Object.assign(inquiry, sanitized);

  try {
    await inquiry.save();

    if (
      Object.hasOwn(sanitized, "inquiryStatus") &&
      inquiry.senderUserId &&
      inquiry.senderUserId !== actorId
    ) {
      await createNotificationForUser(
        {
          title: "Inquiry status updated",
          message: `Your inquiry was marked as ${inquiry.inquiryStatus}`,
          type: "inquiry",
          status: "unread",
          relatedEntityId: inquiry._id,
          relatedEntityType: "inquiry",
        },
        inquiry.senderUserId
      );
    }

    return inquiry;
  } catch (error) {
    logger.error("Inquiry update failed", {
      actorId,
      inquiryId,
      message: error.message,
    });
    throw error;
  }
};

export const updateInquiryStatus = async (inquiryId, inquiryStatus, actorId, actorRole) =>
  updateInquiry(inquiryId, { inquiryStatus }, actorId, actorRole);

export const replyToInquiry = async (inquiryId, replyMessage, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const inquiry = await findInquiryByIdOrThrow(inquiryId);

  if (!isAdminRole(actorRole) && inquiry.receiverUserId !== actorId) {
    throw new AppError("You are not authorized to reply to this inquiry", 403);
  }

  inquiry.replyMessage = replyMessage.trim();
  inquiry.repliedAt = new Date();
  inquiry.repliedBy = actorId;
  inquiry.inquiryStatus = "replied";

  try {
    await inquiry.save();

    if (inquiry.senderUserId && inquiry.senderUserId !== actorId) {
      await createNotificationForUser(
        {
          title: "Inquiry replied",
          message: "A property owner has replied to your inquiry",
          type: "inquiry",
          status: "unread",
          relatedEntityId: inquiry._id,
          relatedEntityType: "inquiry",
        },
        inquiry.senderUserId
      );
    }

    return inquiry;
  } catch (error) {
    logger.error("Inquiry reply failed", {
      actorId,
      inquiryId,
      message: error.message,
    });
    throw error;
  }
};

export const deleteInquiry = async (inquiryId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const inquiry = await findInquiryByIdOrThrow(inquiryId);
  ensureRelevantAccess(inquiry, actorId, actorRole);

  if (!isAdminRole(actorRole) && inquiry.inquiryStatus !== "pending") {
    throw new AppError("Only pending inquiries can be deleted", 400);
  }

  try {
    await inquiry.deleteOne();
  } catch (error) {
    logger.error("Inquiry delete failed", {
      actorId,
      inquiryId,
      message: error.message,
    });
    throw error;
  }
};
