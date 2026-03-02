import express from 'express';
import {
  getDashboard,
  getApplicants,
  getApplicantDetail,
  createIntake,
  // getIntakes,
} from '../controllers/uniadminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// All routes require authentication and ADMIN role
// router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);

router.get('/applicants', getApplicants);

router.get('/applicants/:applicationId', getApplicantDetail);

router.post('/intakes', createIntake);

// router.get('/intakes', getIntakes);

export default router;
