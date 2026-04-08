import mongoose from "mongoose";
import { INQUIRY_STATUSES } from "../constants/inquiry.constants.js";

const { Schema } = mongoose;

const inquirySchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    senderUserId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    receiverUserId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 160,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    contactNumber: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },
    inquiryStatus: {
      type: String,
      enum: INQUIRY_STATUSES,
      default: "pending",
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  }
);

inquirySchema.index({ propertyId: 1, createdAt: -1 });
inquirySchema.index({ senderUserId: 1, createdAt: -1 });
inquirySchema.index({ receiverUserId: 1, createdAt: -1 });
inquirySchema.index({ inquiryStatus: 1, createdAt: -1 });

const Inquiry = mongoose.model("Inquiry", inquirySchema);

export default Inquiry;
