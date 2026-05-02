import logger from "../config/logger.js";
import mongoose from "mongoose";
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

const normalizeReviewerName = (name, actorId = null) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed) return trimmed.slice(0, 120);
  if (typeof actorId === "string" && actorId.length > 6) {
    return `User ${actorId.slice(-6)}`;
  }
  return "User";
};

const ensureRentPropertyForReview = async (propertyId, actorId = null) => {
  const property = await Property.findById(propertyId).select("listingType createdBy");

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  if (property.listingType !== "rent") {
    throw new AppError("Reviews are only allowed for rent properties", 400);
  }

  if (actorId && String(property.createdBy) === String(actorId)) {
    throw new AppError("You cannot review your own property", 403);
  }

  return property;
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

const buildPublicListFilter = (query) => {
  const filter = {};

  if (query.propertyId) filter.propertyId = query.propertyId;
  if (query.userId) filter.userId = query.userId;

  if (query.minRating !== undefined || query.maxRating !== undefined) {
    filter.rating = {};
    if (query.minRating !== undefined) filter.rating.$gte = query.minRating;
    if (query.maxRating !== undefined) filter.rating.$lte = query.maxRating;
  }

  return filter;
};

const computeRatingSummary = async (propertyId) => {
  if (!propertyId) return null;

  const objectId =
    propertyId instanceof mongoose.Types.ObjectId
      ? propertyId
      : mongoose.Types.ObjectId.isValid(propertyId)
      ? new mongoose.Types.ObjectId(propertyId)
      : null;

  if (!objectId) {
    return {
      reviewCount: 0,
      averageRating: 0,
    };
  }

  const [summary] = await Review.aggregate([
    { $match: { propertyId: objectId } },
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
  await ensureRentPropertyForReview(payload.propertyId, actorId);

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
      userName: normalizeReviewerName(payload.userName, actorId),
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

export const getReviewsByProperty = async (propertyId, query, actorId, actorRole) => {
  await ensureRentPropertyForReview(propertyId);
  return listReviews({ ...query, propertyId }, actorId, actorRole);
};

export const getPublicReviewsByProperty = async (propertyId, query = {}) => {
  await ensureRentPropertyForReview(propertyId);

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: sortDirection };
  const filter = buildPublicListFilter({ ...query, propertyId });

  const [items, total, ratingSummary] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limit).populate("propertyId"),
    Review.countDocuments(filter),
    computeRatingSummary(propertyId),
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

export const updateReview = async (reviewId, payload, actorId, actorRole) => {
  ensureAuthenticatedActor(actorId);

  const review = await findReviewByIdOrThrow(reviewId);
  ensureOwnerOrAdmin(review, actorId, actorRole);
  await ensureRentPropertyForReview(review.propertyId, actorId);

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
