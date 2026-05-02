import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  notificationUserIdParamSchema,
  updateNotificationReadSchema,
  updateNotificationSchema,
} from "../validators/notification.validator.js";

const router = Router();

router.use(...authenticate);

router
  .route("/")
  .post(validate(createNotificationSchema), notificationController.createNotification)
  .get(validate(listNotificationsQuerySchema, "query"), notificationController.getNotifications)
  .delete(notificationController.clearNotifications);

router.get(
  "/user/:id",
  validate(notificationUserIdParamSchema, "params"),
  validate(listNotificationsQuerySchema, "query"),
  notificationController.getNotificationsByUser
);

router.patch(
  "/:id/read",
  validate(notificationIdParamSchema, "params"),
  validate(updateNotificationReadSchema),
  notificationController.markNotificationReadState
);

router
  .route("/:id")
  .get(validate(notificationIdParamSchema, "params"), notificationController.getNotificationById)
  .patch(
    validate(notificationIdParamSchema, "params"),
    validate(updateNotificationSchema),
    notificationController.updateNotification
  )
  .delete(
    validate(notificationIdParamSchema, "params"),
    notificationController.deleteNotification
  );

export default router;
