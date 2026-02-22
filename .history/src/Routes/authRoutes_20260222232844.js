import express from 'express';


const router = express.Router();


router.post('/register', register);

router.post('/login', async (req, res) => { });



export default router;
