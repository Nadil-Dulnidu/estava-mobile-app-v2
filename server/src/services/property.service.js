import env from "../config/env.js";
import imageKit, { hasImageKitConfig } from "../config/imagekit.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import {
  PROPERTY_STATUSES,
  STATUS_TRANSITIONS,
} from "../constants/property.constants.js";
import Property from "../models/property.model.js";
import AppError from "../utils/AppError.js";
import {
  ensureSingleCoverImage,
  normalizeImages,
  normalizeStringArray,
} from "../utils/propertyNormalizer.js";

const propertyWriteFields = [
  "title",
  "description",
  "price",
  "listingType",
  "propertyType",
  "status",
  "address",
  "city",
  "district",
  "province",
  "bedrooms",
  "bathrooms",
  "parkingSpaces",
  "landSize",
  "floorArea",
  "furnishedStatus",
  "yearBuilt",
  "features",
  "tags",
  "images",
];

const sanitizePropertyPayload = (payload = {}) => {
  const next = {};

  propertyWriteFields.forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      next[field] = payload[field];
    }
  });

  if (next.features) next.features = normalizeStringArray(next.features);
  if (next.tags) next.tags = normalizeStringArray(next.tags);
  if (next.images) next.images = normalizeImages(next.images);

  return next;
};

const isAdminRole = (role) => role === USER_ROLES.ADMIN;

const ensureOwnerOrAdmin = (property, actorId, actorRole) => {
  if (isAdminRole(actorRole)) return;

  if (!actorId || property.createdBy !== actorId) {
    throw new AppError("You do not have permission to manage this property", 403);
  }
};

const buildListFilter = (query, actorId, actorRole) => {
  const filter = {};

  if (query.listingType) filter.listingType = query.listingType;
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.status) filter.status = query.status;

  if (isAdminRole(actorRole)) {
    if (query.ownerId) filter.createdBy = query.ownerId;
  } else {
    filter.createdBy = actorId;
  }

  if (query.city) filter.city = new RegExp(`^${query.city}$`, "i");
  if (query.search) filter.$text = { $search: query.search };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  if (query.minBedrooms !== undefined || query.maxBedrooms !== undefined) {
    filter.bedrooms = {};
    if (query.minBedrooms !== undefined) filter.bedrooms.$gte = query.minBedrooms;
    if (query.maxBedrooms !== undefined) filter.bedrooms.$lte = query.maxBedrooms;
  }

  return filter;
};

const findPropertyByIdOrThrow = async (propertyId) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  return property;
};

export const createProperty = async (payload, actorId) => {
  if (!actorId) {
    throw new AppError("Authenticated user id is required to create property", 401);
  }

  const sanitized = sanitizePropertyPayload(payload);

  const property = await Property.create({
    ...sanitized,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return property;
};

export const listProperties = async (query, actorId, actorRole) => {
  if (!actorId) {
    throw new AppError("Authenticated user id is required", 401);
  }

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const filter = buildListFilter(query, actorId, actorRole);

  const sort = query.search
    ? { score: { $meta: "textScore" }, [query.sortBy]: sortDirection }
    : { [query.sortBy]: sortDirection };

  const selection = query.search ? { score: { $meta: "textScore" } } : {};

  const [items, total] = await Promise.all([
    Property.find(filter, selection).sort(sort).skip(skip).limit(limit),
    Property.countDocuments(filter),
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

export const getOwnerProperties = async (ownerId, query, actorId, actorRole) => {
  if (!ownerId) {
    throw new AppError("Owner id is required", 400);
  }

  if (!isAdminRole(actorRole) && ownerId !== actorId) {
    throw new AppError("You do not have permission to view these properties", 403);
  }

  return listProperties({ ...query, ownerId }, actorId, actorRole);
};

export const getPropertyById = async (propertyId, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);
  return property;
};

export const updateProperty = async (propertyId, payload, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const sanitized = sanitizePropertyPayload(payload);
  Object.assign(property, sanitized);

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const hardDeleteProperty = async (propertyId, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  await Property.findByIdAndDelete(property._id);
};

export const changePropertyStatus = async (propertyId, nextStatus, actorId, actorRole) => {
  if (!PROPERTY_STATUSES.includes(nextStatus)) {
    throw new AppError("Invalid property status", 400);
  }

  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  if (property.status === nextStatus) {
    return property;
  }

  const allowedTransitions = STATUS_TRANSITIONS[property.status] || [];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new AppError(
      `Status transition not allowed: ${property.status} -> ${nextStatus}`,
      400
    );
  }

  property.status = nextStatus;

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const addPropertyImages = async (propertyId, images, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const incomingImages = normalizeImages(images);

  const existingCover = property.images.some((image) => image.isCover);
  const incomingCover = incomingImages.some((image) => image.isCover);

  if (existingCover && incomingCover) {
    throw new AppError("Property already has a cover image. Use set cover endpoint.", 400);
  }

  property.images.push(...incomingImages);
  ensureSingleCoverImage(property.images);

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const uploadPropertyImage = async (propertyId, payload, actorId, actorRole) => {
  if (!hasImageKitConfig || !imageKit) {
    throw new AppError(
      "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT",
      500
    );
  }

  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  let uploadResult;
  try {
    uploadResult = await imageKit.upload({
      file: payload.file,
      fileName: payload.fileName,
      folder: env.imageKitFolder,
      useUniqueFileName: true,
    });
  } catch {
    throw new AppError("Image upload to ImageKit failed", 502);
  }

  const nextImage = {
    url: uploadResult.url,
    publicId: uploadResult.fileId,
    fileKey: uploadResult.filePath,
    altText: payload.altText?.trim() || null,
    isCover: Boolean(payload.isCover),
  };

  if (nextImage.isCover) {
    property.images.forEach((image) => {
      image.isCover = false;
    });
  }

  property.images.push(nextImage);
  ensureSingleCoverImage(property.images);

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const updatePropertyImage = async (propertyId, imageId, payload, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const image = property.images.id(imageId);

  if (!image) {
    throw new AppError("Property image not found", 404);
  }

  if (payload.url !== undefined) image.url = payload.url.trim();
  if (payload.publicId !== undefined) image.publicId = payload.publicId?.trim() || null;
  if (payload.fileKey !== undefined) image.fileKey = payload.fileKey?.trim() || null;
  if (payload.altText !== undefined) image.altText = payload.altText?.trim() || null;

  if (payload.isCover === true) {
    property.images.forEach((item) => {
      item.isCover = String(item._id) === String(image._id);
    });
  }

  if (payload.isCover === false) {
    image.isCover = false;
  }

  ensureSingleCoverImage(property.images);

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const removePropertyImage = async (propertyId, imageId, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const image = property.images.id(imageId);

  if (!image) {
    throw new AppError("Property image not found", 404);
  }

  const wasCover = image.isCover;
  image.deleteOne();

  if (wasCover && property.images.length > 0) {
    property.images[0].isCover = true;
  }

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const setCoverImage = async (propertyId, imageId, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const image = property.images.id(imageId);

  if (!image) {
    throw new AppError("Property image not found", 404);
  }

  property.images.forEach((item) => {
    item.isCover = String(item._id) === String(image._id);
  });

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const addFeatures = async (propertyId, features, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const nextFeatures = normalizeStringArray(features);
  property.features = [...new Set([...property.features, ...nextFeatures])];

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const replaceFeatures = async (propertyId, features, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  property.features = normalizeStringArray(features);

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};

export const removeFeatures = async (propertyId, features, actorId, actorRole) => {
  const property = await findPropertyByIdOrThrow(propertyId);
  ensureOwnerOrAdmin(property, actorId, actorRole);

  const removeSet = new Set(normalizeStringArray(features));
  property.features = property.features.filter((feature) => !removeSet.has(feature));

  if (actorId) {
    property.updatedBy = actorId;
  }

  await property.save();
  return property;
};
