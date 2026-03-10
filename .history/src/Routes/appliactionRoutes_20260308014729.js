import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';   

const router = express.Router();

// All routes require authentication and USER role
router.use(protect, authorize('user'));

