import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import imageKit, { hasImageKitConfig } from "../config/imagekit.js";
import env from "../config/env.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/imagekit-auth",
  ...authenticate,
  asyncHandler(async (_req, res) => {
    if (!hasImageKitConfig || !imageKit) {
      throw new AppError(
        "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT",
        500
      );
    }

    const authParams = imageKit.getAuthenticationParameters();

    return sendSuccess(res, {
      message: "ImageKit authentication parameters fetched successfully",
      data: {
        ...authParams,
        publicKey: env.imageKitPublicKey,
      },
    });
  })
);

export default router;
