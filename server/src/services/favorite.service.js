import logger from "../config/logger.js";
import Favorite from "../models/favorite.model.js";
import Property from "../models/property.model.js";
import AppError from "../utils/AppError.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;

const sanitizeFavoritePayload = (payload = {}) => {
  const next = {};

  if (Object.hasOwn(payload, "note")) {
    next.note = payload.note?.trim() || null;
  }

  if (Object.hasOwn(payload, "priorityLevel")) {
    next.priorityLevel = payload.priorityLevel ?? null;
  }

  return next;
};

const ensureAuthenticatedActor = (actorId) => {
  if (!actorId || !userIdRegex.test(actorId)) {
    throw new AppError("Authenticated user id is required", 401);
  }
};

const ensureOwnerAccess = (actorId, ownerId) => {
  if (String(actorId) !== String(ownerId)) {
    throw new AppError("You are not authorized to access this favorite", 403);
  }
};

const ensurePropertyExists = async (propertyId) => {
  const property = await Property.exists({ _id: propertyId });

  if (!property) {
    throw new AppError("Property not found", 404);
  }
};

const findFavoriteByIdForActor = async (favoriteId, actorId) => {
  const favorite = await Favorite.findById(favoriteId).populate("propertyId");

  if (!favorite) {
    throw new AppError("Favorite not found", 404);
  }

  ensureOwnerAccess(actorId, favorite.userId);

  return favorite;
};

export const createFavorite = async (payload, actorId) => {
  ensureAuthenticatedActor(actorId);

  const sanitized = sanitizeFavoritePayload(payload);

  await ensurePropertyExists(payload.propertyId);

  const duplicate = await Favorite.exists({
    userId: actorId,
    propertyId: payload.propertyId,
  });

  if (duplicate) {
    throw new AppError("Property is already in favorites", 409);
  }

  try {
    return await Favorite.create({
      userId: actorId,
      propertyId: payload.propertyId,
      ...sanitized,
    });
  } catch (error) {
    logger.error("Favorite create failed", {
      actorId,
      propertyId: payload.propertyId,
      message: error.message,
    });
    throw error;
  }
};

export const listMyFavorites = async (actorId) => {
  ensureAuthenticatedActor(actorId);

  return Favorite.find({ userId: actorId })
    .sort({ createdAt: -1 })
    .populate("propertyId");
};

export const listFavoritesByUser = async (userId, actorId) => {
  ensureAuthenticatedActor(actorId);

  if (!userIdRegex.test(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  ensureOwnerAccess(actorId, userId);

  return Favorite.find({ userId })
    .sort({ createdAt: -1 })
    .populate("propertyId");
};

export const getFavoriteById = async (favoriteId, actorId) => {
  ensureAuthenticatedActor(actorId);
  return findFavoriteByIdForActor(favoriteId, actorId);
};

export const updateFavorite = async (favoriteId, payload, actorId) => {
  ensureAuthenticatedActor(actorId);

  const favorite = await findFavoriteByIdForActor(favoriteId, actorId);
  const sanitized = sanitizeFavoritePayload(payload);

  Object.assign(favorite, sanitized);

  try {
    await favorite.save();
    return favorite;
  } catch (error) {
    logger.error("Favorite update failed", {
      actorId,
      favoriteId,
      message: error.message,
    });
    throw error;
  }
};

export const removeFavorite = async (favoriteId, actorId) => {
  ensureAuthenticatedActor(actorId);

  const favorite = await findFavoriteByIdForActor(favoriteId, actorId);

  try {
    await favorite.deleteOne();
  } catch (error) {
    logger.error("Favorite delete failed", {
      actorId,
      favoriteId,
      message: error.message,
    });
    throw error;
  }
};
