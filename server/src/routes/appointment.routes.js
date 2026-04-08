import { Router } from "express";
import * as appointmentController from "../controllers/appointment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  appointmentAgentIdParamSchema,
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../validators/appointment.validator.js";

const router = Router();

router.use(...authenticate);

router
  .route("/")
  .post(validate(createAppointmentSchema), appointmentController.createAppointment)
  .get(validate(listAppointmentsQuerySchema, "query"), appointmentController.getAppointments);

router.get(
  "/agent/:id",
  validate(appointmentAgentIdParamSchema, "params"),
  validate(listAppointmentsQuerySchema, "query"),
  appointmentController.getAppointmentsByAgent
);

router.patch(
  "/:id/status",
  validate(appointmentIdParamSchema, "params"),
  validate(updateAppointmentStatusSchema),
  appointmentController.updateAppointmentStatus
);

router
  .route("/:id")
  .get(validate(appointmentIdParamSchema, "params"), appointmentController.getAppointmentById)
  .patch(
    validate(appointmentIdParamSchema, "params"),
    validate(updateAppointmentSchema),
    appointmentController.updateAppointment
  )
  .delete(validate(appointmentIdParamSchema, "params"), appointmentController.deleteAppointment);

export default router;
