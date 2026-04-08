import { getAuth, requireAuth } from "@clerk/express";
import AppError from "../utils/AppError.js";

const resolveRole = (sessionClaims = {}) => {
  const roleCandidates = [
    sessionClaims.role,
    sessionClaims.metadata?.role,
    sessionClaims.public_metadata?.role,
    sessionClaims.publicMetadata?.role,
  ];

  const role = roleCandidates.find((value) => typeof value === "string");
  return role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
};

export const authenticate = [
  requireAuth(),
  (req, _res, next) => {
    const auth = getAuth(req);

    if (!auth?.userId) {
      return next(new AppError("Authentication required", 401));
    }

    req.user = {
      id: auth.userId,
      role: resolveRole(auth.sessionClaims || {}),
      sessionId: auth.sessionId || null,
    };

    return next();
  },
];

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user?.id) {
    return next(new AppError("Authentication required", 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to perform this action", 403));
  }

  return next();
};
