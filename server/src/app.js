import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import env from "./config/env.js";
import logger from "./config/logger.js";
import errorHandler from "./middlewares/error.middleware.js";
import notFound from "./middlewares/notFound.middleware.js";
import requestLogger from "./middlewares/requestLogger.middleware.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errors: [],
  },
});

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl === "*" ? true : env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: env.jsonLimit }));
app.use(clerkMiddleware());
app.use(requestLogger);
app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Estava backend is running",
  });
});

app.use("/api/uploads", uploadRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favorites", favoriteRoutes);

app.use(notFound);
app.use(errorHandler);

logger.info("Express app initialized", {
  env: env.nodeEnv,
});

export default app;
