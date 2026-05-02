import Joi from "joi";

export const dashboardSummaryQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
});
