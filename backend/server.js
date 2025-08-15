const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const projectRoutes = require("./routes/projects");
const chatRoutes = require("./routes/chat");
const commentRoutes = require("./routes/comments");
const trendingRoutes = require("./routes/trending");
const uploadRoute = require("./routes/upload");
const notificationRoutes = require("./routes/notifications");
const analyticsRoutes = require("./routes/analytics");
const aiRoutes = require("./routes/ai");
const discussionRoutes = require("./routes/discussions");


const { setupSocketIO } = require("./socket/socket");
const { setupRedisAdapter } = require("./socket/redis-adapter");
const redisService = require("./utils/redisService");

const app = express();
const server = createServer(app);

// Socket.IO setup with Redis adapter for multiple instances
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  // Enable sticky sessions for load balancing
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  // Add instance ID for debugging
  ...(process.env.INSTANCE_ID && { 
    extraHeaders: { 'X-Instance-ID': process.env.INSTANCE_ID } 
  })
});

// Make io available to routes
app.set("io", io);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));
app.use("/api", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/trending", trendingRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/discussions", discussionRoutes);


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "DevLink API is running",
    timestamp: new Date().toISOString(),
    instance: process.env.INSTANCE_ID || 'single',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    redis: {
      available: redisService.isAvailable(),
      type: redisService.getRedisType()
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Initialize Redis service
    console.log(`🔧 Redis Service: ${redisService.getRedisType()}`);
    if (redisService.isAvailable()) {
      console.log("✅ Redis is available for caching and Socket.IO");
    } else {
      console.log("⚠️  Redis not available - using in-memory for Socket.IO");
    }

    // Setup Redis adapter for Socket.IO (for multi-instance support)
    setupRedisAdapter(io);
    
    // Setup Socket.IO
    setupSocketIO(io);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Instance ID: ${process.env.INSTANCE_ID || 'single'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🆔 Process ID: ${process.pid}`);
      console.log(`💾 Redis Type: ${redisService.getRedisType()}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = { app, server, io };
