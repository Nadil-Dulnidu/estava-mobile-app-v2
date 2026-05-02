import { Router } from "express";
import * as propertyController from "../controllers/property.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  listPropertiesQuerySchema,
  propertyIdParamSchema,
} from "../validators/property.validator.js";
import {
  listReviewsQuerySchema,
  reviewPropertyIdParamSchema,
} from "../validators/review.validator.js";

const router = Router();

router.get(
  "/properties",
  validate(listPropertiesQuerySchema, "query"),
  propertyController.getPublicProperties
);

router.get(
  "/properties/:id",
  validate(propertyIdParamSchema, "params"),
  propertyController.getPublicPropertyById
);

router.get(
  "/properties/:id/reviews",
  validate(reviewPropertyIdParamSchema, "params"),
  validate(listReviewsQuerySchema, "query"),
  reviewController.getPublicReviewsByProperty
);

export default router;
