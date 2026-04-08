import logger from "../config/logger.js";
import * as inquiryService from "../services/inquiry.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActor = (req) => ({
  id: req.user?.id,
  role: req.user?.role || "USER",
});

export const createInquiry = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const inquiry = await inquiryService.createInquiry(req.body, actor.id, actor.role);

    logger.info("Inquiry created", {
      inquiryId: inquiry._id,
      propertyId: inquiry.propertyId,
      senderUserId: inquiry.senderUserId,
      receiverUserId: inquiry.receiverUserId,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Inquiry created successfully",
      data: inquiry,
    });
  } catch (error) {
    logger.error("Inquiry create request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      propertyId: req.body?.propertyId,
      message: error.message,
    });
    throw error;
  }
});

export const getInquiries = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await inquiryService.listInquiries(req.query, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Inquiries fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getInquiryById = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const inquiry = await inquiryService.getInquiryById(req.params.id, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Inquiry fetched successfully",
    data: inquiry,
  });
});

export const getInquiriesByReceiver = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await inquiryService.getInquiriesByReceiver(
    req.params.id,
    req.query,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Receiver inquiries fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getInquiriesBySender = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await inquiryService.getInquiriesBySender(
    req.params.id,
    req.query,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Sender inquiries fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const updateInquiry = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const inquiry = await inquiryService.updateInquiry(
      req.params.id,
      req.body,
      actor.id,
      actor.role
    );

    logger.info("Inquiry updated", {
      inquiryId: inquiry._id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Inquiry updated successfully",
      data: inquiry,
    });
  } catch (error) {
    logger.error("Inquiry update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      inquiryId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const inquiry = await inquiryService.updateInquiryStatus(
      req.params.id,
      req.body.inquiryStatus,
      actor.id,
      actor.role
    );

    logger.info("Inquiry status updated", {
      inquiryId: inquiry._id,
      inquiryStatus: inquiry.inquiryStatus,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Inquiry status updated successfully",
      data: inquiry,
    });
  } catch (error) {
    logger.error("Inquiry status update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      inquiryId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const deleteInquiry = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    await inquiryService.deleteInquiry(req.params.id, actor.id, actor.role);

    logger.info("Inquiry deleted", {
      inquiryId: req.params.id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Inquiry deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("Inquiry delete request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      inquiryId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});
