import logger from "../config/logger.js";
import * as propertyService from "../services/property.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActor = (req) => ({
  id: req.user?.id,
  role: req.user?.role || "USER",
});

export const createProperty = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.createProperty(req.body, actor.id);

  logger.info("Property created", {
    propertyId: property._id,
    ownerId: property.createdBy,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Property created successfully",
    data: property,
  });
});

export const getProperties = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await propertyService.listProperties(req.query, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Properties fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getPublicProperties = asyncHandler(async (req, res) => {
  const result = await propertyService.listPublicProperties(req.query);

  return sendSuccess(res, {
    message: "Public properties fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getPropertiesByOwner = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await propertyService.getOwnerProperties(
    req.params.ownerId,
    req.query,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Owner properties fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getMyProperties = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await propertyService.getOwnerProperties(actor.id, req.query, actor.id, actor.role);

  return sendSuccess(res, {
    message: "My properties fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getPropertyById = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.getPropertyById(req.params.id, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Property fetched successfully",
    data: property,
  });
});

export const getPublicPropertyById = asyncHandler(async (req, res) => {
  const property = await propertyService.getPublicPropertyById(req.params.id);

  return sendSuccess(res, {
    message: "Public property fetched successfully",
    data: property,
  });
});

export const updateProperty = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.updateProperty(
    req.params.id,
    req.body,
    actor.id,
    actor.role
  );

  logger.info("Property updated", {
    propertyId: property._id,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property updated successfully",
    data: property,
  });
});

export const deleteProperty = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  await propertyService.hardDeleteProperty(req.params.id, actor.id, actor.role);

  logger.info("Property hard deleted", {
    propertyId: req.params.id,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property deleted permanently",
    data: null,
  });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.changePropertyStatus(
    req.params.id,
    req.body.status,
    actor.id,
    actor.role
  );

  logger.info("Property status changed", {
    propertyId: property._id,
    status: property.status,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property status updated successfully",
    data: property,
  });
});

export const moderateProperty = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.moderateProperty(
    req.params.id,
    req.body,
    actor.id,
    actor.role
  );

  logger.info("Property moderation updated", {
    propertyId: property._id,
    moderationStatus: property.moderationStatus,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property moderation updated successfully",
    data: property,
  });
});

export const addImages = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.addPropertyImages(
    req.params.id,
    req.body.images,
    actor.id,
    actor.role
  );

  logger.info("Property images added", {
    propertyId: property._id,
    count: req.body.images.length,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property images added successfully",
    data: property,
  });
});

export const uploadImage = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.uploadPropertyImage(
    req.params.id,
    req.body,
    actor.id,
    actor.role
  );

  logger.info("Property image uploaded to ImageKit", {
    propertyId: property._id,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property image uploaded successfully",
    data: property,
  });
});

export const updateImage = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.updatePropertyImage(
    req.params.id,
    req.params.imageId,
    req.body,
    actor.id,
    actor.role
  );

  logger.info("Property image updated", {
    propertyId: property._id,
    imageId: req.params.imageId,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property image updated successfully",
    data: property,
  });
});

export const removeImage = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.removePropertyImage(
    req.params.id,
    req.params.imageId,
    actor.id,
    actor.role
  );

  logger.info("Property image removed", {
    propertyId: property._id,
    imageId: req.params.imageId,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property image removed successfully",
    data: property,
  });
});

export const makeCoverImage = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.setCoverImage(
    req.params.id,
    req.params.imageId,
    actor.id,
    actor.role
  );

  logger.info("Property cover image changed", {
    propertyId: property._id,
    imageId: req.params.imageId,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Cover image updated successfully",
    data: property,
  });
});

export const addFeatures = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.addFeatures(
    req.params.id,
    req.body.features,
    actor.id,
    actor.role
  );

  logger.info("Property features added", {
    propertyId: property._id,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Features added successfully",
    data: property,
  });
});

export const replaceFeatures = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.replaceFeatures(
    req.params.id,
    req.body.features,
    actor.id,
    actor.role
  );

  logger.info("Property features replaced", {
    propertyId: property._id,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Features replaced successfully",
    data: property,
  });
});

export const removeFeatures = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.removeFeatures(
    req.params.id,
    req.body.features,
    actor.id,
    actor.role
  );

  logger.info("Property features removed", {
    propertyId: property._id,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Features removed successfully",
    data: property,
  });
});
