import express from 'express';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';  

const app = express();

const server = express.Router();

config();
connectDB();


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



process.on("unhandledRejection")