import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import { 
    submitApplication,
    getAllApplications, 
    getApplicationById,
    viewDocument, 
    updateApplication, 
    deleteApplication 
} from '../controllers/applicationController.js';

const router = express.Router();

// Configure multer for memory storage (no temp files)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ADMIN only - get all applications
router.get('/all/applications', protect, authorize('ADMIN'), getAllApplications);
router.get('/search', protect, authorize('ADMIN'), getApplicationById);
router.get('/view/:id', protect, authorize('ADMIN'), viewDocument);

// USER routes
router.post('/apply', protect, authorize('USER'), upload.single('document'), submitApplication); 
router.delete('/:id', protect, authorize('USER'), deleteApplication);

export default router;