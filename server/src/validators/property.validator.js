import Joi from "joi";
import {
  FURNISHED_STATUSES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "../constants/property.constants.js";

const currentYear = new Date().getFullYear();
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const nonEmptyTrimmedString = Joi.string().trim().min(1);

const imageSchema = Joi.object({
  url: Joi.string().trim().uri({ scheme: ["http", "https"] }).required(),
  publicId: Joi.string().trim().allow(null, ""),
  fileKey: Joi.string().trim().allow(null, ""),
  altText: Joi.string().trim().max(150).allow(null, ""),
  isCover: Joi.boolean().default(false),
});

const basePropertySchema = {
  title: Joi.string().trim().min(5).max(160),
  description: Joi.string().trim().min(20).max(4000),
  price: Joi.number().positive(),
  listingType: Joi.string()
    .trim()
    .lowercase()
    .valid(...LISTING_TYPES),
  propertyType: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_TYPES),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_STATUSES),
  address: Joi.string().trim().min(5).max(300),
  city: Joi.string().trim().min(2).max(80),
  district: Joi.string().trim().max(80).allow(null, ""),
  province: Joi.string().trim().max(80).allow(null, ""),
  bedrooms: Joi.number().min(0),
  bathrooms: Joi.number().min(0),
  parkingSpaces: Joi.number().min(0),
  landSize: Joi.number().min(0),
  floorArea: Joi.number().min(0),
  furnishedStatus: Joi.string()
    .trim()
    .lowercase()
    .valid(...FURNISHED_STATUSES)
    .allow(null),
  yearBuilt: Joi.number().integer().min(1800).max(currentYear + 1).allow(null),
  features: Joi.array().items(nonEmptyTrimmedString).default([]),
  tags: Joi.array().items(nonEmptyTrimmedString).default([]),
  images: Joi.array().items(imageSchema).default([]),
};

const withCoverRule = (schema) =>
  schema.custom((value, helpers) => {
    if (!value.images) return value;

    const coverCount = value.images.filter((image) => image.isCover).length;
    if (coverCount > 1) {
      return helpers.error("any.invalid", {
        message: "Only one image can be marked as cover",
      });
    }

    return value;
  });

export const createPropertySchema = withCoverRule(
  Joi.object({
    ...basePropertySchema,
    title: basePropertySchema.title.required(),
    description: basePropertySchema.description.required(),
    price: basePropertySchema.price.required(),
    listingType: basePropertySchema.listingType.required(),
    propertyType: basePropertySchema.propertyType.required(),
    address: basePropertySchema.address.required(),
    city: basePropertySchema.city.required(),
    createdBy: Joi.forbidden(),
    updatedBy: Joi.forbidden(),
    deletedBy: Joi.forbidden(),
    isDeleted: Joi.forbidden(),
    deletedAt: Joi.forbidden(),
  }).custom((value, helpers) => {
    const isLand = value.propertyType === "land";
    const hasBedrooms = value.bedrooms !== undefined && value.bedrooms !== null;
    const hasBathrooms = value.bathrooms !== undefined && value.bathrooms !== null;

    if (!isLand && (!hasBedrooms || !hasBathrooms)) {
      return helpers.error("any.invalid", {
        message: "bedrooms and bathrooms are required for non-land properties",
      });
    }

    return value;
  })
);

export const updatePropertySchema = withCoverRule(
  Joi.object({
    ...basePropertySchema,
    createdBy: Joi.forbidden(),
    updatedBy: Joi.forbidden(),
    deletedBy: Joi.forbidden(),
    isDeleted: Joi.forbidden(),
    deletedAt: Joi.forbidden(),
  }).min(1)
);

export const propertyIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
});

export const imageIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid property id",
  }),
  imageId: Joi.string().pattern(objectIdRegex).required().messages({
    "string.pattern.base": "Invalid image id",
  }),
});

export const listPropertiesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "price", "title", "city")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  search: Joi.string().trim().max(120).allow(""),
  listingType: Joi.string()
    .trim()
    .lowercase()
    .valid(...LISTING_TYPES),
  propertyType: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_TYPES),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_STATUSES),
  city: Joi.string().trim().max(80),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minBedrooms: Joi.number().integer().min(0),
  maxBedrooms: Joi.number().integer().min(0),
}).custom((value, helpers) => {
  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    value.minPrice > value.maxPrice
  ) {
    return helpers.error("any.invalid", {
      message: "minPrice cannot be greater than maxPrice",
    });
  }

  if (
    value.minBedrooms !== undefined &&
    value.maxBedrooms !== undefined &&
    value.minBedrooms > value.maxBedrooms
  ) {
    return helpers.error("any.invalid", {
      message: "minBedrooms cannot be greater than maxBedrooms",
    });
  }

  return value;
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...PROPERTY_STATUSES)
    .required(),
});

export const addImagesSchema = Joi.object({
  images: Joi.array().items(imageSchema).min(1).required(),
});

export const updateImageSchema = Joi.object({
  url: Joi.string().trim().uri({ scheme: ["http", "https"] }),
  publicId: Joi.string().trim().allow(null, ""),
  fileKey: Joi.string().trim().allow(null, ""),
  altText: Joi.string().trim().max(150).allow(null, ""),
  isCover: Joi.boolean(),
}).min(1);

export const featureListSchema = Joi.object({
  features: Joi.array().items(nonEmptyTrimmedString).min(1).required(),
});

export const removeFeaturesSchema = Joi.object({
  features: Joi.array().items(nonEmptyTrimmedString).min(1).required(),
});
