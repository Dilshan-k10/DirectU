import { body, validationResult } from 'express-validator';
import { prisma } from '../config/db.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const registerValidation = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }),
    validate
];

export const loginValidation = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];


export const validateOwnership = async (req, res, next) => {
    try {
        const applicationId = req.params.applicationId || req.params.id;
        if (!applicationId) return next();

        const application = await prisma.applications.findUnique({
            where: { id: applicationId }
        });

        if (!application) return res.status(404).json({ error: 'Application not found' });

        if (application.candidate_id !== req.user.id && req.user.role.lower !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const validateIntakeActive = async (req, res, next) => {
    try {
        const intakeId = req.body.intake_id || req.params.intakeId;
        if (!intakeId) return next();

        const intake = await prisma.intakes.findUnique({
            where: { id: intakeId }
        });

        if (!intake) return res.status(404).json({ error: 'Intake not found' });

        const today = new Date();
        if (intake.start_date && today < new Date(intake.start_date)) {
            return res.status(400).json({ error: 'Applications not open yet' });
        }
        if (intake.end_date && today > new Date(intake.end_date)) {
            return res.status(400).json({ error: 'Application period has ended' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};