import { Router } from "express";
import * as propertyController from "../controllers/property.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  listPropertiesQuerySchema,
  propertyIdParamSchema,
} from "../validators/property.validator.js";

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

export default router;
