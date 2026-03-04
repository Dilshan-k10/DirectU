import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { refreshAccessToken } from '../controllers/refreshTokenController.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';


const router = express.Router();


router.post('/register', registerValidation, register);

router.post('/login', loginValidation, login); 

router.post('/logout', logout);

router.post('/refresh', refreshAccessToken);




export default router;
