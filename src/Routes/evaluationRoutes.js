import express from 'express';
import {
  getQualificationStatus,
  selectAlternativeProgram,
} from '../controllers/evaluationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require a valid token for all evaluation endpoints (any authenticated role)
router.use(protect);

// Get qualification status + suggested alternative programs for an application
router.get('/:applicationId', getQualificationStatus);

// Select an alternative program (updates Application.programId for exam generation)
router.post('/:applicationId/select-alternative', selectAlternativeProgram);

export default router;
