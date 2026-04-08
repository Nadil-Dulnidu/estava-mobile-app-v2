import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  adminPropertyIdParamSchema,
  dashboardSummaryQuerySchema,
  moderatePropertySchema,
  moderationListQuerySchema,
} from "../validators/admin.validator.js";

const router = Router();

router.use(...authenticate);
router.use(authorizeRoles(USER_ROLES.ADMIN));

router.get(
  "/dashboard/summary",
  validate(dashboardSummaryQuerySchema, "query"),
  adminController.getDashboardSummary
);

router.get(
  "/properties/moderation",
  validate(moderationListQuerySchema, "query"),
  adminController.getModerationProperties
);

router.patch(
  "/properties/:id/moderation",
  validate(adminPropertyIdParamSchema, "params"),
  validate(moderatePropertySchema),
  adminController.moderateProperty
);

export default router;
