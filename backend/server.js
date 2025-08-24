import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import routes from "./src/presentation/routes/index.js";
import { errorHandler } from "./src/presentation/middleware/errorHandler.js";
import {
  connectDatabase,
  closePool,
} from "./src/infrastructure/database/connection.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: [process.env.FRONTEND_URL1, process.env.FRONTEND_URL2],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-session-id",
    ],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // Limit each IP
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Raw body logging middleware (for debugging) - BEFORE body parsing
app.use((req, res, next) => {
  if (req.method === "POST" && req.path.includes("/cart/items")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      console.log(`🔍 Raw Body Received:`, body || "[EMPTY]");
      console.log(`🔍 Content-Type:`, req.headers["content-type"]);
      console.log(`🔍 Content-Length:`, req.headers["content-length"]);
    });
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "GiftBloom Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    documentation: "/api",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler for unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await closePool();
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await closePool();
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    // Establish database connection first
    console.log("🔄 Establishing database connection...");
    await connectDatabase();
    console.log("✅ Database connection established successfully");

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`
🚀 GiftBloom Backend API Server Started!
📍 Environment: ${process.env.NODE_ENV || "development"}
🌐 Server running on: http://localhost:${PORT}
📚 API Documentation: http://localhost:${PORT}/api
💚 Health Check: http://localhost:${PORT}/health
�️  Database: Connected
�🕐 Started at: ${new Date().toISOString()}
      `);
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error(
      "💡 Please check your database configuration and ensure PostgreSQL is running"
    );
    process.exit(1);
  }
};

// Start the application
const server = await startServer();

export default app;
