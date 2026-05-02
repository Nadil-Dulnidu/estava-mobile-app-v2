import app from "./app.js";
import connectDB from "./config/database.js";
import env from "./config/env.js";
import logger from "./config/logger.js";
import { initSocket } from "./sockets/socket.js";
import { createServer } from "node:http";

const startServer = async () => {
  await connectDB();

  const httpServer = createServer(app);
  initSocket(httpServer, { corsOrigin: env.clientUrl });

  const server = httpServer.listen(env.port, () => {
    logger.info("Server started", {
      port: env.port,
      env: env.nodeEnv,
    });
  });

  const shutdown = (signal) => {
    logger.warn(`Received ${signal}. Starting graceful shutdown.`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
