import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import {
  getRandomQuestionsByDegree,
  submitStudentAnswers,
  calculateFinalScoreAndSave,
  recalculateDegreeRankings,
  getStudentRankings,
} from '../controllers/examController.js';

const router = express.Router();


router.use(protect);


router.get('/questions/:degreeId', authorize('USER'), getRandomQuestionsByDegree);


router.post('/submit', authorize('USER'), submitStudentAnswers);


router.post('/calculate-score', authorize('USER'), calculateFinalScoreAndSave);


router.get('/rankings', authorize('USER'), getStudentRankings);


router.post('/rankings/recalculate/:degreeId', authorize('ADMIN'), recalculateDegreeRankings);

export default router;

