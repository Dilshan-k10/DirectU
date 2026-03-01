import express from 'express';
import {
  getDashboard,
  getApplicants,
  getApplicantDetail,
  createIntake,
  // getIntakes,
} from '../controllers/uniadminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);

router.get('/applicants', getApplicants);

router.get('/applicants/:applicationId', getApplicantDetail);

router.post('/intakes', createIntake);

// router.get('/intakes', getIntakes);

export default router;
