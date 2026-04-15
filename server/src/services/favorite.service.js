import logger from "../config/logger.js";
import imageKit, { hasImageKitConfig } from "../config/imagekit.js";
import env from "../config/env.js";
import Favorite from "../models/favorite.model.js";
import Property from "../models/property.model.js";
import AppError from "../utils/AppError.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;
const IMAGEKIT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
const normalizeNote = (value) => value?.trim() || null;

const sanitizeFavoritePayload = (payload = {}) => {
  const next = {};

  if (Object.hasOwn(payload, "note")) {
    next.note = normalizeNote(payload.note);
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

const buildImageDeliveryUrl = (image = {}) => {
  const currentUrl = typeof image.url === "string" ? image.url.trim() : "";
  const fileKey = typeof image.fileKey === "string" ? image.fileKey.trim() : "";

  if (currentUrl) return currentUrl;
  if (!fileKey) return "";
  if (!hasImageKitConfig || !imageKit?.helper?.buildSrc) return currentUrl;

  try {
    const src = fileKey.startsWith("/") ? fileKey : `/${fileKey}`;
    const signedUrl = imageKit.helper.buildSrc({
      src,
      urlEndpoint: env.imageKitUrlEndpoint,
      signed: true,
      expiresIn: IMAGEKIT_SIGNED_URL_TTL_SECONDS,
    });
    return typeof signedUrl === "string" && signedUrl.trim() ? signedUrl : "";
  } catch {
    return currentUrl;
  }
};

const mapFavoriteForClient = (favorite) => {
  if (!favorite) return favorite;

  const plain =
    typeof favorite.toObject === "function" ? favorite.toObject() : favorite;

  const property =
    plain.propertyId && typeof plain.propertyId === "object"
      ? plain.propertyId
      : null;

  if (!property || !Array.isArray(property.images)) {
    return plain;
  }

  return {
    ...plain,
    propertyId: {
      ...property,
      images: property.images.map((image) => ({
        ...image,
        url: buildImageDeliveryUrl(image),
      })),
    },
  };
};

const mapFavoritesForClient = (favorites = []) =>
  favorites.map((item) => mapFavoriteForClient(item));

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
    const favorite = await Favorite.create({
      userId: actorId,
      propertyId: payload.propertyId,
      ...sanitized,
    });

    return mapFavoriteForClient(favorite);
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

  const items = await Favorite.find({ userId: actorId })
    .sort({ createdAt: -1 })
    .populate("propertyId");

  return mapFavoritesForClient(items);
};

export const listFavoritesByUser = async (userId, actorId) => {
  ensureAuthenticatedActor(actorId);

  if (!userIdRegex.test(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  ensureOwnerAccess(actorId, userId);

  const items = await Favorite.find({ userId })
    .sort({ createdAt: -1 })
    .populate("propertyId");

  return mapFavoritesForClient(items);
};

export const getFavoriteById = async (favoriteId, actorId) => {
  ensureAuthenticatedActor(actorId);
  const favorite = await findFavoriteByIdForActor(favoriteId, actorId);
  return mapFavoriteForClient(favorite);
};

export const updateFavorite = async (favoriteId, payload, actorId) => {
  ensureAuthenticatedActor(actorId);

  const favorite = await findFavoriteByIdForActor(favoriteId, actorId);
  const sanitized = sanitizeFavoritePayload(payload);

  Object.assign(favorite, sanitized);

  try {
    await favorite.save();
    return mapFavoriteForClient(favorite);
  } catch (error) {
    logger.error("Favorite update failed", {
      actorId,
      favoriteId,
      message: error.message,
    });
    throw error;
  }
};

export const updateFavoriteNote = async (favoriteId, note, actorId) => {
  ensureAuthenticatedActor(actorId);

  const favorite = await findFavoriteByIdForActor(favoriteId, actorId);
  favorite.note = normalizeNote(note);

  try {
    await favorite.save();
    return mapFavoriteForClient(favorite);
  } catch (error) {
    logger.error("Favorite note update failed", {
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
