import express from 'express';
import {
  getDashboard,
  getApplicants,
  getApplicantDetail,
  getApplicantExamDetail,
  createIntake,
  updateIntake,
  // getIntakes,
  createDegree,
  getDegrees,
  updateDegree,
} from '../controllers/uniadminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(protect, authorize('ADMIN'));

router.get('/dashboard', getDashboard);

router.get('/applicants', getApplicants);

router.get('/applicants/:applicationId', getApplicantDetail);

router.get('/applicants/:applicationId/exam', getApplicantExamDetail);

router.post('/intakes', createIntake);

router.put('/intakes/:intakeId', updateIntake);

router.post('/degrees', createDegree);

router.get('/degrees', getDegrees);

router.put('/degrees/:degreeId', updateDegree);

// router.get('/intakes', getIntakes);

export default router;
