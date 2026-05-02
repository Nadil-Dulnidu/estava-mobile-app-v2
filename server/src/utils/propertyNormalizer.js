import AppError from "./AppError.js";

export const normalizeStringArray = (values = []) => {
  if (!Array.isArray(values)) {
    throw new AppError("Expected an array of strings", 400);
  }

  const normalized = values
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter(Boolean);

  return [...new Set(normalized)];
};

export const normalizeImages = (images = []) => {
  if (!Array.isArray(images)) {
    throw new AppError("Images must be an array", 400);
  }

  let coverCount = 0;

  const normalized = images.map((image) => {
    const item = {
      url: image.url?.trim(),
      publicId: image.publicId?.trim(),
      fileKey: image.fileKey?.trim(),
      altText: image.altText?.trim(),
      isCover: Boolean(image.isCover),
    };

    if (item.isCover) coverCount += 1;
    return item;
  });

  if (coverCount > 1) {
    throw new AppError("Only one image can be marked as cover", 400);
  }

  return normalized;
};

export const ensureSingleCoverImage = (images = []) => {
  const coverImages = images.filter((image) => image.isCover);

  if (coverImages.length > 1) {
    throw new AppError("Only one image can be marked as cover", 400);
  }

  return images;
};
