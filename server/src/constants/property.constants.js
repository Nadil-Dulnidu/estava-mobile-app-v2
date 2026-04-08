export const LISTING_TYPES = ["sale", "rent"];

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "land",
  "commercial",
];

export const PROPERTY_STATUSES = [
  "available",
  "sold",
  "rented",
  "unavailable",
];

export const FURNISHED_STATUSES = [
  "furnished",
  "semi-furnished",
  "unfurnished",
];

export const STATUS_TRANSITIONS = {
  available: ["sold", "rented", "unavailable"],
  sold: ["available", "unavailable"],
  rented: ["available", "unavailable"],
  unavailable: ["available", "sold", "rented"],
};

export const PROPERTY_MODERATION_STATUSES = ["pending", "approved", "rejected"];
