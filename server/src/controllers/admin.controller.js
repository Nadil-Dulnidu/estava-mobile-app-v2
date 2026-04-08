import logger from "../config/logger.js";
import * as adminService from "../services/admin.service.js";
import * as propertyService from "../services/property.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const getActor = (req) => ({
  id: req.user?.id,
  role: req.user?.role || "USER",
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await adminService.getDashboardSummary(req.query);

  return sendSuccess(res, {
    message: "Admin dashboard summary fetched successfully",
    data: summary,
  });
});

export const getModerationProperties = asyncHandler(async (req, res) => {
  const result = await adminService.listModerationProperties(req.query);

  return sendSuccess(res, {
    message: "Moderation properties fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

export const moderateProperty = asyncHandler(async (req, res) => {
  const actor = getActor(req);
  const property = await propertyService.moderateProperty(
    req.params.id,
    req.body,
    actor.id,
    actor.role
  );

  logger.info("Admin moderated property", {
    propertyId: property._id,
    moderationStatus: property.moderationStatus,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return sendSuccess(res, {
    message: "Property moderated successfully",
    data: property,
  });
});
