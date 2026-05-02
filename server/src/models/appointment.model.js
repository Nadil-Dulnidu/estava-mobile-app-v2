import mongoose from "mongoose";
import { APPOINTMENT_STATUSES } from "../constants/appointment.constants.js";

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    agentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    appointmentDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    visitPurpose: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    appointmentStatus: {
      type: String,
      enum: APPOINTMENT_STATUSES,
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

appointmentSchema.index({ userId: 1, propertyId: 1, appointmentDateTime: 1 });
appointmentSchema.index({ agentId: 1, createdAt: -1 });
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ propertyId: 1, createdAt: -1 });
appointmentSchema.index({ appointmentStatus: 1, createdAt: -1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
