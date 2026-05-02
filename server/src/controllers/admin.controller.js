import * as adminService from "../services/admin.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await adminService.getDashboardSummary(req.query);

  return sendSuccess(res, {
    message: "Admin dashboard summary fetched successfully",
    data: summary,
  });
});

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getDashboardAnalytics(req.query);

  return sendSuccess(res, {
    message: "Admin dashboard analytics fetched successfully",
    data: analytics,
  });
});
