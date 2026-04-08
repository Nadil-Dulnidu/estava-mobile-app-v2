import logger from "../config/logger.js";
import * as appointmentService from "../services/appointment.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActor = (req) => ({
  id: req.user?.id,
  role: req.user?.role || "USER",
});

export const createAppointment = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const appointment = await appointmentService.createAppointment(req.body, actor.id);

    logger.info("Appointment created", {
      appointmentId: appointment._id,
      propertyId: appointment.propertyId,
      userId: appointment.userId,
      agentId: appointment.agentId,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    logger.error("Appointment create request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      propertyId: req.body?.propertyId,
      appointmentDateTime: req.body?.appointmentDateTime,
      message: error.message,
    });
    throw error;
  }
});

export const getAppointments = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await appointmentService.listAppointments(req.query, actor.id, actor.role);

  return sendSuccess(res, {
    message: "Appointments fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const appointment = await appointmentService.getAppointmentById(
    req.params.id,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Appointment fetched successfully",
    data: appointment,
  });
});

export const getAppointmentsByAgent = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const result = await appointmentService.getAppointmentsByAgent(
    req.params.id,
    req.query,
    actor.id,
    actor.role
  );

  return sendSuccess(res, {
    message: "Agent appointments fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body,
      actor.id,
      actor.role
    );

    logger.info("Appointment updated", {
      appointmentId: appointment._id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    logger.error("Appointment update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      appointmentId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    const appointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      req.body.appointmentStatus,
      actor.id,
      actor.role
    );

    logger.info("Appointment status updated", {
      appointmentId: appointment._id,
      appointmentStatus: appointment.appointmentStatus,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    logger.error("Appointment status update request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      appointmentId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const actor = getActor(req);

  try {
    await appointmentService.deleteAppointment(req.params.id, actor.id, actor.role);

    logger.info("Appointment deleted", {
      appointmentId: req.params.id,
      actorId: actor.id,
      actorRole: actor.role,
    });

    return sendSuccess(res, {
      message: "Appointment deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("Appointment delete request failed", {
      actorId: actor.id,
      actorRole: actor.role,
      appointmentId: req.params.id,
      message: error.message,
    });
    throw error;
  }
});
