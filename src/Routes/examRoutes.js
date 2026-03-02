import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import { getRandomQuestionsByDegree } from '../controllers/examController.js';

const router = express.Router();

// All exam routes require authentication
router.use(protect);

// GET /api/exam/questions/:degreeId
router.get('/exam/questions/:degreeId', authorize('USER'), getRandomQuestionsByDegree);

export default router;

