import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import { 
    submitApplication, 
    getApplicationById, 
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

// All routes require authentication and USER role
router.use(protect, authorize('USER', 'ADMIN'));

router.post('/apply', upload.single('document'), submitApplication); 
// router.get('/my-applications', getMyApplications);
// router.get('/:id', getApplicationById);
// router.put('/:id', upload.single('document'), updateApplication);
// router.delete('/:id', deleteApplication);

export default router;