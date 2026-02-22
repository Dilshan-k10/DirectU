import express from 'express';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';  
import { error } from 'console';

const app = express();

const server = express.Router();

config();
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

process

