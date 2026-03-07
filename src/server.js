import express from 'express';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB, disconnectDB } from './config/db.js';  
import { error } from 'console';
import authRoutes from './Routes/authRoutes.js';
import uniadminRoutes from './Routes/uniadminRoutes.js';
import examRoutes from './Routes/examRoutes.js';
import userRoutes from './Routes/userRoutes.js';

const app = express();
const server = express.Router();

config();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use("/auth", authRoutes);
app.use("/uniadmin", uniadminRoutes);
app.use("/exam", examRoutes);
app.use("/users", userRoutes);

connectDB();


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



process.on("unhandledRejection", async (error) => { 
  console.error("Unhandled Rejection:", error);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    await disconnectDB();
    console.log("Server closed and database disconnected. Exiting process.");
    process.exit(0);
  });
});

