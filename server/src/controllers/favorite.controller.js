import logger from "../config/logger.js";
import * as favoriteService from "../services/favorite.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActorId = (req) => req.user?.id || req.user?._id;

export const createFavorite = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);

  try {
    const favorite = await favoriteService.createFavorite(req.body, actorId);

    logger.info("Favorite created", {
      favoriteId: favorite._id,
      actorId,
      propertyId: favorite.propertyId,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Favorite created successfully",
      data: favorite,
    });
  } catch (error) {
    logger.error("Favorite create request failed", {
      actorId,
      propertyId: req.body?.propertyId,
      message: error.message,
    });
    throw error;
  }
});

export const getMyFavorites = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const favorites = await favoriteService.listMyFavorites(actorId);

  return sendSuccess(res, {
    message: "Favorites fetched successfully",
    data: favorites,
  });
});

export const getFavoritesByUser = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const favorites = await favoriteService.listFavoritesByUser(req.params.id, actorId);

  return sendSuccess(res, {
    message: "User favorites fetched successfully",
    data: favorites,
  });
});

export const getFavoriteById = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const favorite = await favoriteService.getFavoriteById(req.params.id, actorId);

  return sendSuccess(res, {
    message: "Favorite fetched successfully",
    data: favorite,
  });
});

export const updateFavorite = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);

  try {
    const favorite = await favoriteService.updateFavorite(req.params.id, req.body, actorId);

    logger.info("Favorite updated", {
      favoriteId: favorite._id,
      actorId,
    });

    return sendSuccess(res, {
      message: "Favorite updated successfully",
      data: favorite,
    });
  } catch (error) {
    logger.error("Favorite update request failed", {
      actorId,
      favoriteId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const updateFavoriteNote = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);

  try {
    const favorite = await favoriteService.updateFavoriteNote(
      req.params.id,
      req.body.note,
      actorId
    );

    logger.info("Favorite note updated", {
      favoriteId: favorite._id,
      actorId,
    });

    return sendSuccess(res, {
      message: "Favorite note updated successfully",
      data: favorite,
    });
  } catch (error) {
    logger.error("Favorite note update request failed", {
      actorId,
      favoriteId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const deleteFavorite = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);

  try {
    await favoriteService.removeFavorite(req.params.id, actorId);

    logger.info("Favorite deleted", {
      favoriteId: req.params.id,
      actorId,
    });

    return sendSuccess(res, {
      message: "Favorite deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("Favorite delete request failed", {
      actorId,
      favoriteId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});
