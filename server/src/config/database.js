import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== "production",
    });
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed", {
      error: error.message,
    });
    process.exit(1);
  }
};

export default connectDB;
