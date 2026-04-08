import { Router } from "express";
import * as favoriteController from "../controllers/favorite.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createFavoriteSchema,
  favoriteIdParamSchema,
  favoriteUserIdParamSchema,
  updateFavoriteSchema,
} from "../validators/favorite.validator.js";

const router = Router();

router.use(...authenticate);

router
  .route("/")
  .post(validate(createFavoriteSchema), favoriteController.createFavorite)
  .get(favoriteController.getMyFavorites);

router.get(
  "/user/:id",
  validate(favoriteUserIdParamSchema, "params"),
  favoriteController.getFavoritesByUser
);

router
  .route("/:id")
  .get(validate(favoriteIdParamSchema, "params"), favoriteController.getFavoriteById)
  .patch(
    validate(favoriteIdParamSchema, "params"),
    validate(updateFavoriteSchema),
    favoriteController.updateFavorite
  )
  .delete(validate(favoriteIdParamSchema, "params"), favoriteController.deleteFavorite);

export default router;
