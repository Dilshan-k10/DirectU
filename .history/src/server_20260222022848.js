import express from 'express';
import { config } from 'dotenv';
import

const app = express();

const server = express.Router();

config();


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

