import express from 'express';
import { getAllApplicants, getAllAdmins } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/applicants', getAllApplicants);

router.get('/admins', getAllAdmins);

export default router;
