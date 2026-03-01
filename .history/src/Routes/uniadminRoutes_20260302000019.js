import express from 'express';
import {
  uniAdminLogin,
  getDashboard,
  getApplicants,
  getApplicantDetail,
  createIntake,
  // getIntakes,
} from '../controllers/uniadminController.js';

const router = express.Router();

router.post('/login', uniAdminLogin);

router.get('/dashboard', getDashboard);

router.get('/applicants', getApplicants);

router.get('/applicants/:applicationId', getApplicantDetail);

router.post('/intakes', createIntake);

router.get('/intakes', getIntakes);

export default router;

