import { Server } from "socket.io";
import logger from "../config/logger.js";

const userIdRegex = /^user_[a-zA-Z0-9]+$/;

let ioInstance = null;

const getHandshakeUserId = (socket) => {
  const candidate =
    socket.handshake?.auth?.userId ||
    socket.handshake?.query?.userId ||
    socket.handshake?.headers?.["x-user-id"];

  if (typeof candidate !== "string") {
    return null;
  }

  return candidate.trim();
};

export const getUserRoom = (userId) => `user:${userId}`;

export const initSocket = (httpServer, { corsOrigin = "*" } = {}) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin,
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    const userId = getHandshakeUserId(socket);

    if (!userId || !userIdRegex.test(userId)) {
      logger.warn("Socket authentication failed", {
        socketId: socket.id,
      });
      return next(new Error("Authentication required"));
    }

    socket.data.userId = userId;
    return next();
  });

  ioInstance.on("connection", (socket) => {
    const { userId } = socket.data;
    const room = getUserRoom(userId);

    socket.join(room);

    logger.info("Socket connected", {
      socketId: socket.id,
      userId,
    });

    logger.info("Socket user joined room", {
      socketId: socket.id,
      userId,
      room,
    });

    socket.on("error", (error) => {
      logger.error("Socket error", {
        socketId: socket.id,
        userId,
        message: error.message,
      });
    });

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", {
        socketId: socket.id,
        userId,
        reason,
      });
    });
  });

  ioInstance.on("error", (error) => {
    logger.error("Socket server error", {
      message: error.message,
    });
  });

  return ioInstance;
};

export const getSocket = () => ioInstance;

export const emitToUserRoom = (userId, eventName, payload) => {
  if (!ioInstance) {
    logger.warn("Socket emit skipped because socket server is not initialized", {
      userId,
      eventName,
    });
    return false;
  }

  if (!userId || !userIdRegex.test(userId)) {
    logger.warn("Socket emit skipped due to invalid user id", {
      userId,
      eventName,
    });
    return false;
  }

  const room = getUserRoom(userId);
  ioInstance.to(room).emit(eventName, payload);

  logger.info("Socket event emitted", {
    eventName,
    userId,
    room,
  });

  return true;
};
