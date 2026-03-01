import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// All candidate routes require authentication
router.use(protect);

// Only USER role can submit applications
router.post('/applications', authorize('USER'), (req, res) => {
  // Application submission logic
});

// Only USER role can upload CV
router.post('/applications/:id/cv', authorize('USER'), (req, res) => {
  // CV upload logic
});

// Only USER role can take test
router.post('/test/:id/submit', authorize('USER'), (req, res) => {
  // Test submission logic
});

// USER can view their own applications
router.get('/my-applications', authorize('USER'), (req, res) => {
  // Get user's applications
});

// Both ADMIN and USER can view application details
router.get('/applications/:id', authorize('ADMIN', 'USER'), (req, res) => {
  // Get application details
});

export default router;
