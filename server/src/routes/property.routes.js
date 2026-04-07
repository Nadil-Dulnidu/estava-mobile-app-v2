import { Router } from "express";
import * as propertyController from "../controllers/property.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  addImagesSchema,
  createPropertySchema,
  featureListSchema,
  imageIdParamSchema,
  listPropertiesQuerySchema,
  propertyIdParamSchema,
  removeFeaturesSchema,
  updateImageSchema,
  updatePropertySchema,
  updateStatusSchema,
} from "../validators/property.validator.js";

const router = Router();

router
  .route("/")
  .post(validate(createPropertySchema), propertyController.createProperty)
  .get(validate(listPropertiesQuerySchema, "query"), propertyController.getProperties);

router
  .route("/:id")
  .get(validate(propertyIdParamSchema, "params"), propertyController.getPropertyById)
  .patch(
    validate(propertyIdParamSchema, "params"),
    validate(updatePropertySchema),
    propertyController.updateProperty
  )
  .delete(validate(propertyIdParamSchema, "params"), propertyController.deleteProperty);

router.patch(
  "/:id/status",
  validate(propertyIdParamSchema, "params"),
  validate(updateStatusSchema),
  propertyController.changeStatus
);

router.post(
  "/:id/images",
  validate(propertyIdParamSchema, "params"),
  validate(addImagesSchema),
  propertyController.addImages
);

router.patch(
  "/:id/images/:imageId",
  validate(imageIdParamSchema, "params"),
  validate(updateImageSchema),
  propertyController.updateImage
);

router.delete(
  "/:id/images/:imageId",
  validate(imageIdParamSchema, "params"),
  propertyController.removeImage
);

router.patch(
  "/:id/images/:imageId/cover",
  validate(imageIdParamSchema, "params"),
  propertyController.makeCoverImage
);

router.post(
  "/:id/features",
  validate(propertyIdParamSchema, "params"),
  validate(featureListSchema),
  propertyController.addFeatures
);

router.put(
  "/:id/features",
  validate(propertyIdParamSchema, "params"),
  validate(featureListSchema),
  propertyController.replaceFeatures
);

router.delete(
  "/:id/features",
  validate(propertyIdParamSchema, "params"),
  validate(removeFeaturesSchema),
  propertyController.removeFeatures
);

export default router;
