import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createReviewSchema,
  listReviewsQuerySchema,
  reviewIdParamSchema,
  reviewPropertyIdParamSchema,
  updateReviewSchema,
} from "../validators/review.validator.js";

const router = Router();

router.use(...authenticate);

router
  .route("/")
  .post(validate(createReviewSchema), reviewController.createReview)
  .get(validate(listReviewsQuerySchema, "query"), reviewController.getReviews);

router.get(
  "/property/:id",
  validate(reviewPropertyIdParamSchema, "params"),
  validate(listReviewsQuerySchema, "query"),
  reviewController.getReviewsByProperty
);

router
  .route("/:id")
  .get(validate(reviewIdParamSchema, "params"), reviewController.getReviewById)
  .patch(
    validate(reviewIdParamSchema, "params"),
    validate(updateReviewSchema),
    reviewController.updateReview
  )
  .delete(validate(reviewIdParamSchema, "params"), reviewController.deleteReview);

export default router;
