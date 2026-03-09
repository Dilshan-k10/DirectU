import { prisma } from '../config/db.js';

const submitApplication = async (req, res) => {
    try {
        const { programId, intakeId } = req.body;
        const candidateId = req.user.id;
        const document = req.file;

        if (!programId || !intakeId) {
            return res.status(400).json({ error: 'Program ID and Intake ID are required' });
        }

        if (!document) {
            return res.status(400).json({ error: 'Document is required' });
        }

        const application = await prisma.application.create({
            data: {
                candidateId: candidateId,
                programId: programId,
                intakeId: intakeId,
                status: 'submitted',
                documentData: document.buffer,
                documentName: document.originalname,
                documentType: document.mimetype,
            },
        });

        res.status(201).json({
            status: 'success',
            message: 'Application submitted successfully',
            data: {
                id: application.id,
                candidateId: application.candidateId,
                programId: application.programId,
                intakeId: application.intakeId,
                status: application.status,
                documentName: application.documentName,
                appliedAt: application.appliedAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to submit application',
            message: error.message,
        });
    }
};

const getAllApplications = async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            select: {
                id: true,
                candidateId: true,
                programId: true,
                intakeId: true,
                status: true,
                documentName: true,
                appliedAt: true,
                updatedAt: true,
                candidate: { select: { id: true, name: true, email: true } },
                program: { select: { name: true, level: true } },
                intake: { select: { name: true, year: true } },
            },
            orderBy: { appliedAt: 'desc' },
        });

        res.status(200).json({
            status: 'success',
            count: applications.length,
            data: applications,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch applications',
            message: error.message,
        });
    }
};

const getApplicationById = async (req, res) => {
    try {
        const { id, candidateId } = req.query;

        if (!id && !candidateId) {
            return res.status(400).json({ error: 'Application ID or Candidate ID is required' });
        }

        const where = {};
        if (id) where.id = id;
        if (candidateId) where.candidateId = candidateId;

        const applications = await prisma.application.findMany({
            where: where,
            select: {
                id: true,
                candidateId: true,
                programId: true,
                intakeId: true,
                status: true,
                documentName: true,
                documentType: true,
                appliedAt: true,
                updatedAt: true,
                candidate: { select: { id: true, name: true, email: true } },
                program: true,
                intake: true,
            },
        });

        if (applications.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.status(200).json({
            status: 'success',
            count: applications.length,
            data: applications,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch application',
            message: error.message,
        });
    }
};

const viewDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await prisma.application.findUnique({
            where: { id: id },
            select: {
                documentData: true,
                documentName: true,
                documentType: true,
            },
        });

        if (!application || !application.documentData) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.setHeader('Content-Type', application.documentType);
        res.setHeader('Content-Disposition', `inline; filename="${application.documentName}"`);
        res.send(application.documentData);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to view document',
            message: error.message,
        });
    }
};


const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const candidateId = req.user.id;

        const existingApp = await prisma.application.findFirst({
            where: { id: id, candidateId: candidateId },
        });

        if (!existingApp) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (existingApp.status !== 'submitted') {
            return res.status(400).json({ error: 'Cannot delete application after submission review' });
        }

        await prisma.application.delete({
            where: { id: id },
        });

        res.status(200).json({
            status: 'success',
            message: 'Application deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete application',
            message: error.message,
        });
    }
};

export { submitApplication, getAllApplications, getApplicationById, viewDocument };