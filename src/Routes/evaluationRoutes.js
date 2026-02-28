import express from 'express';
import { getEvaluation, 
    reconsiderApplication, 
    suggestAlternative } from '../controllers/evaluationController.js';

const router = express.Router();

// Get evaluation result for a specific application (Candidate or Admin)
router.get('/:applicationId', getEvaluation);

// Candidate reconsiders application (switch or continue) - one-time only
router.post('/:applicationId/reconsider', reconsiderApplication);

// Admin suggests or updates alternative program
router.post('/:applicationId/suggest-alternative', suggestAlternative);

export default router;
