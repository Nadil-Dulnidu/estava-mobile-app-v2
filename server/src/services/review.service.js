import logger from "../config/logger.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from "../constants/review.constants.js";
import Property from "../models/property.model.js";
import Review from "../models/review.model.js";
import AppError from "../utils/AppError.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;

const isAdminRole = (role) => role === USER_ROLES.ADMIN;

const sanitizeReviewPayload = (payload = {}) => {
  const next = {};

  if (Object.hasOwn(payload, "rating")) {
    next.rating = payload.rating;
  }

  if (Object.hasOwn(payload, "comment")) {
    next.comment = payload.comment?.trim() || null;
  }

  return next;
};

const ensureAuthenticatedActor = (actorId) => {
  if (!actorId || !userIdRegex.test(actorId)) {
    throw new AppError("Authenticated user id is required", 401);
  }
};

const ensureValidRating = (rating) => {
  if (rating < REVIEW_RATING_MIN || rating > REVIEW_RATING_MAX) {
    throw new AppError("Invalid rating value", 400);
  }
};

const ensurePropertyExists = async (propertyId) => {
  const property = await Property.exists({ _id: propertyId });

  if (!property) {
    throw new AppError("Property not found", 404);
  }
};

const ensureOwnerOrAdmin = (review, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  if (review.userId !== actorId) {
    throw new AppError("You are not authorized to manage this review", 403);
  }
};

const ensureUserListAccess = (requestedUserId, actorId, actorRole) => {
  if (!requestedUserId) return;
  if (isAdminRole(actorRole)) return;

  if (requestedUserId !== actorId) {
    throw new AppError("You are not authorized to view these reviews", 403);
  }
};

const findReviewByIdOrThrow = async (reviewId) => {
  const review = await Review.findById(reviewId).populate("propertyId");

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  return review;
};

const buildListFilter = (query, actorId, actorRole) => {
  const filter = {};

  if (query.propertyId) filter.propertyId = query.propertyId;
  if (query.userId) filter.userId = query.userId;

  if (query.minRating !== undefined || query.maxRating !== undefined) {
    filter.rating = {};
    if (query.minRating !== undefined) filter.rating.$gte = query.minRating;
    if (query.maxRating !== undefined) filter.rating.$lte = query.maxRating;
  }

  ensureUserListAccess(query.userId, actorId, actorRole);

  return filter;
};

const computeRatingSummary = async (propertyId) => {
  if (!propertyId) return null;

  const [summary] = await Review.aggregate([
    { $match: { propertyId } },
    {
      $group: {
        _id: "$propertyId",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (!summary) {
    return {
      reviewCount: 0,
      averageRating: 0,
    };
  }

  return {
    reviewCount: summary.reviewCount,
    averageRating: Number(summary.averageRating.toFixed(2)),
  };
};

export const createReview = async (payload, actorId) => {
  ensureAuthenticatedActor(actorId);
  ensureValidRating(payload.rating);
  await ensurePropertyExists(payload.propertyId);

  const duplicate = await Review.exists({
    userId: actorId,
    propertyId: payload.propertyId,
  });

  if (duplicate) {
    throw new AppError("You have already reviewed this property", 409);
  }

  const sanitized = sanitizeReviewPayload(payload);

  try {
    return await Review.create({
      ...sanitized,
      userId: actorId,
      propertyId: payload.propertyId,
    });
  } catch (error) {
    logger.error("Review create failed", {
      actorId,
      propertyId: payload.propertyId,
      message: error.message,
    });
    throw error;
  }
};

export const listReviews = async (query, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: sortDirection };
  const filter = buildListFilter(query, actorId, actorRole);

  const [items, total, ratingSummary] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limit).populate("propertyId"),
    Review.countDocuments(filter),
    computeRatingSummary(query.propertyId),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      ...(ratingSummary ? ratingSummary : {}),
    },
  };
};

export const getReviewById = async (reviewId, actorId) => {
  ensureAuthenticatedActor(actorId);
  return findReviewByIdOrThrow(reviewId);
};

export const getReviewsByProperty = async (propertyId, query, actorId, actorRole) =>
  listReviews({ ...query, propertyId }, actorId, actorRole);

export const updateReview = async (reviewId, payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const review = await findReviewByIdOrThrow(reviewId);
  ensureOwnerOrAdmin(review, actorId, actorRole);

  const sanitized = sanitizeReviewPayload(payload);

  if (Object.hasOwn(sanitized, "rating")) {
    ensureValidRating(sanitized.rating);
  }

  Object.assign(review, sanitized);

  try {
    await review.save();
    return review;
  } catch (error) {
    logger.error("Review update failed", {
      actorId,
      reviewId,
      message: error.message,
    });
    throw error;
  }
};

export const deleteReview = async (reviewId, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const review = await findReviewByIdOrThrow(reviewId);
  ensureOwnerOrAdmin(review, actorId, actorRole);

  try {
    await review.deleteOne();
  } catch (error) {
    logger.error("Review delete failed", {
      actorId,
      reviewId,
      message: error.message,
    });
    throw error;
  }
};
