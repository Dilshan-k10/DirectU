import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { refreshAccessToken } from '../controllers/refreshTokenController.js';


const router = express.Router();


router.post('/register', register);

router.post('/login', login); 

router.post('/logout', logout);

router.post('/refresh', refreshAccessToken);




export default router;
