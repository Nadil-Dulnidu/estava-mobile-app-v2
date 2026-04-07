import logger from "../config/logger.js";
import * as propertyService from "../services/property.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActorId = (req) => req.user?.id || req.user?._id || req.headers["x-user-id"];

export const createProperty = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.createProperty(req.body, actorId);

  logger.info("Property created", {
    propertyId: property._id,
    actorId,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Property created successfully",
    data: property,
  });
});

export const getProperties = asyncHandler(async (req, res) => {
  const result = await propertyService.listProperties(req.query);

  return sendSuccess(res, {
    message: "Properties fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getPropertyById = asyncHandler(async (req, res) => {
  const property = await propertyService.getPropertyById(req.params.id);

  return sendSuccess(res, {
    message: "Property fetched successfully",
    data: property,
  });
});

export const updateProperty = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.updateProperty(req.params.id, req.body, actorId);

  logger.info("Property updated", {
    propertyId: property._id,
    actorId,
  });

  return sendSuccess(res, {
    message: "Property updated successfully",
    data: property,
  });
});

export const deleteProperty = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  await propertyService.softDeleteProperty(req.params.id, actorId);

  logger.info("Property deleted (soft)", {
    propertyId: req.params.id,
    actorId,
  });

  return sendSuccess(res, {
    message: "Property deleted successfully",
    data: null,
  });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.changePropertyStatus(
    req.params.id,
    req.body.status,
    actorId
  );

  logger.info("Property status changed", {
    propertyId: property._id,
    status: property.status,
    actorId,
  });

  return sendSuccess(res, {
    message: "Property status updated successfully",
    data: property,
  });
});

export const addImages = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.addPropertyImages(req.params.id, req.body.images, actorId);

  logger.info("Property images added", {
    propertyId: property._id,
    count: req.body.images.length,
    actorId,
  });

  return sendSuccess(res, {
    message: "Property images added successfully",
    data: property,
  });
});

export const updateImage = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.updatePropertyImage(
    req.params.id,
    req.params.imageId,
    req.body,
    actorId
  );

  logger.info("Property image updated", {
    propertyId: property._id,
    imageId: req.params.imageId,
    actorId,
  });

  return sendSuccess(res, {
    message: "Property image updated successfully",
    data: property,
  });
});

export const removeImage = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.removePropertyImage(req.params.id, req.params.imageId, actorId);

  logger.info("Property image removed", {
    propertyId: property._id,
    imageId: req.params.imageId,
    actorId,
  });

  return sendSuccess(res, {
    message: "Property image removed successfully",
    data: property,
  });
});

export const makeCoverImage = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.setCoverImage(req.params.id, req.params.imageId, actorId);

  logger.info("Property cover image changed", {
    propertyId: property._id,
    imageId: req.params.imageId,
    actorId,
  });

  return sendSuccess(res, {
    message: "Cover image updated successfully",
    data: property,
  });
});

export const addFeatures = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.addFeatures(req.params.id, req.body.features, actorId);

  logger.info("Property features added", {
    propertyId: property._id,
    actorId,
  });

  return sendSuccess(res, {
    message: "Features added successfully",
    data: property,
  });
});

export const replaceFeatures = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.replaceFeatures(req.params.id, req.body.features, actorId);

  logger.info("Property features replaced", {
    propertyId: property._id,
    actorId,
  });

  return sendSuccess(res, {
    message: "Features replaced successfully",
    data: property,
  });
});

export const removeFeatures = asyncHandler(async (req, res) => {
  const actorId = getActorId(req);
  const property = await propertyService.removeFeatures(req.params.id, req.body.features, actorId);

  logger.info("Property features removed", {
    propertyId: property._id,
    actorId,
  });

  return sendSuccess(res, {
    message: "Features removed successfully",
    data: property,
  });
});
