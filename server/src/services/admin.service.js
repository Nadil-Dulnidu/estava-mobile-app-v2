import Appointment from "../models/appointment.model.js";
import Inquiry from "../models/inquiry.model.js";
import Property from "../models/property.model.js";

const buildModerationFilter = (query) => {
  const filter = {};

  if (query.moderationStatus) filter.moderationStatus = query.moderationStatus;
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.listingType) filter.listingType = query.listingType;
  if (query.search) filter.$text = { $search: query.search };

  return filter;
};

export const getDashboardSummary = async (query) => {
  const sinceDate = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

  const [
    totalProperties,
    pendingModeration,
    approvedProperties,
    rejectedProperties,
    recentProperties,
    totalAppointments,
    totalInquiries,
  ] = await Promise.all([
    Property.countDocuments({}),
    Property.countDocuments({ moderationStatus: "pending" }),
    Property.countDocuments({ moderationStatus: "approved" }),
    Property.countDocuments({ moderationStatus: "rejected" }),
    Property.countDocuments({ createdAt: { $gte: sinceDate } }),
    Appointment.countDocuments({}),
    Inquiry.countDocuments({}),
  ]);

  return {
    totalProperties,
    pendingModeration,
    approvedProperties,
    rejectedProperties,
    recentProperties,
    totalAppointments,
    totalInquiries,
  };
};

export const listModerationProperties = async (query) => {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = query.search
    ? { score: { $meta: "textScore" }, [query.sortBy]: sortDirection }
    : { [query.sortBy]: sortDirection };
  const selection = query.search ? { score: { $meta: "textScore" } } : {};
  const filter = buildModerationFilter(query);

  const [items, total] = await Promise.all([
    Property.find(filter, selection).sort(sort).skip(skip).limit(limit),
    Property.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
