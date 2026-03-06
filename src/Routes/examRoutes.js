import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import {
  getRandomQuestionsByDegree,
  submitStudentAnswers,
  calculateFinalScoreAndSave,
} from '../controllers/examController.js';

const router = express.Router();

// All exam routes require authentication
router.use(protect);

// GET /api/exam/questions/:degreeId
router.get('/questions/:degreeId', authorize('USER'), getRandomQuestionsByDegree);

// POST /api/exam/submit
router.post('/submit', authorize('USER'), submitStudentAnswers);

// POST /api/exam/calculate-score
router.post('/calculate-score', authorize('USER'), calculateFinalScoreAndSave);

export default router;

