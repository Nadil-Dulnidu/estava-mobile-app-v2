import mongoose from "mongoose";
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from "../constants/review.constants.js";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: REVIEW_RATING_MIN,
      max: REVIEW_RATING_MAX,
    },
    comment: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  }
);

reviewSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
reviewSchema.index({ propertyId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
