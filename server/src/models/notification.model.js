import mongoose from "mongoose";
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from "../constants/notification.constants.js";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      default: "general",
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUSES,
      required: true,
      default: "unread",
      trim: true,
      lowercase: true,
      index: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    relatedEntityType: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
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

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
