import express from 'express';


const app = express();

const server = express.Router();

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

