import express from 'express';
import {config}

const app = express();

const server = express.Router();

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

