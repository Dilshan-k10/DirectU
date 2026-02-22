import express from 'express';
import { register, ge } from '../controllers/authController.js';


const router = express.Router();


router.post('/register', register);

router.get('/login', getregister); 




export default router;
