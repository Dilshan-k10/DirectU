import express from 'express';
import {
  sendWelcomeEmailController,
  sendApplicationSubmissionEmailController,
  sendExamSubmissionEmailController,
  processIntakeResultsEmailController,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

router.post('/welcome', sendWelcomeEmailController);
router.post('/application-submitted', sendApplicationSubmissionEmailController);
router.post('/exam-submitted', sendExamSubmissionEmailController);

router.post(
  '/intakes/:intakeId/process-results',
  protect,
  authorize('ADMIN'),
  processIntakeResultsEmailController
);

export default router;

