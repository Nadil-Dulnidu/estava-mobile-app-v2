import logger from "../config/logger.js";
import * as reviewService from "../services/review.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActor = (req) => ({
  id: req.user?.id,
  role: req.user?.role || "USER",
});

export const createReview = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const review = await reviewService.createReview(req.body, actor.id);

    logger.info("Review created", {
      reviewId: review._id,
      propertyId: review.propertyId,
      userId: review.userId,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    logger.error("Review create request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      propertyId: req.body?.propertyId,
      message: error.message,
    });
    throw error;
  }
});

export const getReviews = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await reviewService.listReviews(req.query, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Reviews fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getReviewsByProperty = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await reviewService.getReviewsByProperty(
    req.params.id,
    req.query,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Property reviews fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getReviewById = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const review = await reviewService.getReviewById(req.params.id, actor.id);

  return sendSuccess(res, {
    message: "Review fetched successfully",
    data: review,
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const review = await reviewService.updateReview(
      req.params.id,
      req.body,
      actor.id,
      actor.role
    );

    logger.info("Review updated", {
      reviewId: review._id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    logger.error("Review update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      reviewId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const deleteReview = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    await reviewService.deleteReview(req.params.id, actor.id, actor.role);

    logger.info("Review deleted", {
      reviewId: req.params.id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Review deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("Review delete request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      reviewId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});
