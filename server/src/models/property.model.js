import mongoose from "mongoose";
import {
  FURNISHED_STATUSES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  RESIDENTIAL_PROPERTY_TYPES,
  STATUS_OPTIONS_BY_LISTING_TYPE,
  PROPERTY_TYPES,
} from "../constants/property.constants.js";

const { Schema } = mongoose;
const residentialTypeSet = new Set(RESIDENTIAL_PROPERTY_TYPES);

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(value) {
          try {
            const parsed = new URL(value);
            return ["http:", "https:"].includes(parsed.protocol);
          } catch {
            return false;
          }
        },
        message: "Image url must be a valid URL",
      },
    },
    publicId: {
      type: String,
      trim: true,
      default: null,
    },
    fileKey: {
      type: String,
      trim: true,
      default: null,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },
    isCover: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const propertySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 4000,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    listingType: {
      type: String,
      required: true,
      enum: LISTING_TYPES,
      trim: true,
      lowercase: true,
    },
    propertyType: {
      type: String,
      required: true,
      enum: PROPERTY_TYPES,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      default: "available",
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    district: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    province: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: null,
    },
    bathrooms: {
      type: Number,
      min: 0,
      default: null,
    },
    parkingSpaces: {
      type: Number,
      min: 0,
      default: null,
    },
    landSize: {
      type: Number,
      min: 0,
      default: null,
    },
    floorArea: {
      type: Number,
      min: 0,
      default: null,
    },
    distanceFromCityCenterKm: {
      type: Number,
      min: 0,
      default: null,
    },
    furnishedStatus: {
      type: String,
      enum: FURNISHED_STATUSES,
      trim: true,
      lowercase: true,
      default: null,
    },
    yearBuilt: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear() + 1,
      default: null,
    },
    features: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    updatedBy: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  }
);

propertySchema.path("features").set((values = []) => [...new Set(values)]);
propertySchema.path("tags").set((values = []) => [...new Set(values)]);

propertySchema.pre("validate", function enforcePropertyRules(next) {
  const isResidentialType = residentialTypeSet.has(this.propertyType);
  const isLandType = this.propertyType === "land";
  const isCommercialType = this.propertyType === "commercial";

  if (isResidentialType) {
    if (this.bedrooms === null || this.bedrooms === undefined) {
      this.invalidate("bedrooms", "bedrooms is required for residential properties");
    }

    if (this.bathrooms === null || this.bathrooms === undefined) {
      this.invalidate("bathrooms", "bathrooms is required for residential properties");
    }
  }

  if (isLandType && (this.landSize === null || this.landSize === undefined)) {
    this.invalidate("landSize", "landSize is required for land properties");
  }

  if (isCommercialType && (this.floorArea === null || this.floorArea === undefined)) {
    this.invalidate("floorArea", "floorArea is required for commercial properties");
  }

  const allowedStatuses = STATUS_OPTIONS_BY_LISTING_TYPE[this.listingType] || [];
  if (!allowedStatuses.includes(this.status)) {
    this.invalidate(
      "status",
      `status ${this.status} is not valid for listingType ${this.listingType}`
    );
  }

  const coverCount = (this.images || []).filter((image) => image.isCover).length;

  if (coverCount > 1) {
    this.invalidate("images", "Only one image can be marked as cover");
  }

  next();
});

propertySchema.index({ city: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ createdBy: 1, createdAt: -1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ title: "text", description: "text", address: "text" });

const Property = mongoose.model("Property", propertySchema);

export default Property;
