export const LISTING_TYPES = ["sale", "rent"];

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "land",
  "commercial",
];

export const RESIDENTIAL_PROPERTY_TYPES = ["apartment", "house", "villa"];

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

export const STATUS_OPTIONS_BY_LISTING_TYPE = {
  sale: ["available", "sold", "unavailable"],
  rent: ["available", "rented", "unavailable"],
};
