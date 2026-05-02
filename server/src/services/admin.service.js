import Appointment from "../models/appointment.model.js";
import Inquiry from "../models/inquiry.model.js";
import Property from "../models/property.model.js";
import Review from "../models/review.model.js";

export const getDashboardSummary = async (query) => {
  const sinceDate = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

  const [
    totalProperties,
    recentProperties,
    totalAppointments,
    totalInquiries,
  ] = await Promise.all([
    Property.countDocuments({}),
    Property.countDocuments({ createdAt: { $gte: sinceDate } }),
    Appointment.countDocuments({}),
    Inquiry.countDocuments({}),
  ]);

  return {
    totalProperties,
    recentProperties,
    totalAppointments,
    totalInquiries,
  };
};

const formatDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const buildDailyRange = (days) => {
  const values = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    values.push(formatDateKey(date));
  }

  return values;
};

export const getDashboardAnalytics = async (query) => {
  const sinceDate = new Date();
  sinceDate.setHours(0, 0, 0, 0);
  sinceDate.setDate(sinceDate.getDate() - (query.days - 1));

  const [dailyRaw, byTypeRaw, byStatusRaw, reviewRaw, totalReviews] = await Promise.all([
    Property.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          saleCount: {
            $sum: { $cond: [{ $eq: ["$listingType", "sale"] }, 1, 0] },
          },
          rentCount: {
            $sum: { $cond: [{ $eq: ["$listingType", "rent"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Property.aggregate([
      {
        $group: {
          _id: "$propertyType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Property.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          lowRatingCount: {
            $sum: {
              $cond: [{ $lte: ["$rating", 2] }, 1, 0],
            },
          },
        },
      },
    ]),
    Review.countDocuments({}),
  ]);

  const dailyMap = new Map(dailyRaw.map((item) => [item._id, item]));
  const dailyListings = buildDailyRange(query.days).map((dateKey) => {
    const source = dailyMap.get(dateKey);
    return {
      date: dateKey,
      count: source?.count || 0,
      saleCount: source?.saleCount || 0,
      rentCount: source?.rentCount || 0,
    };
  });

  const byType = byTypeRaw.map((item) => ({
    label: item._id || "unknown",
    count: item.count,
  }));

  const byStatus = byStatusRaw.map((item) => ({
    label: item._id || "unknown",
    count: item.count,
  }));

  const ratingSummary = reviewRaw[0] || { averageRating: 0, lowRatingCount: 0 };

  return {
    days: query.days,
    dailyListings,
    byType,
    byStatus,
    reviewMetrics: {
      totalReviews,
      averageRating: Number((ratingSummary.averageRating || 0).toFixed(2)),
      lowRatingCount: ratingSummary.lowRatingCount || 0,
    },
  };
};
