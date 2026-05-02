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

    if (env.imageKitPublicKey.startsWith("http")) {
      throw new AppError(
        "IMAGEKIT_PUBLIC_KEY appears invalid. It should be the ImageKit public key (e.g. public_xxx), not a URL.",
        500
      );
    }

    const authParams =
      typeof imageKit?.helper?.getAuthenticationParameters === "function"
        ? imageKit.helper.getAuthenticationParameters()
        : typeof imageKit?.getAuthenticationParameters === "function"
          ? imageKit.getAuthenticationParameters()
          : null;

    if (!authParams) {
      throw new AppError("ImageKit SDK does not expose authentication parameter generation", 500);
    }

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
