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

// const getMyApplications = async (req, res) => {
//     try {
//         const candidateId = req.user.id;

//         const applications = await prisma.application.findMany({
//             where: { candidateId: candidateId },
//             select: {
//                 id: true,
//                 programId: true,
//                 intakeId: true,
//                 status: true,
//                 documentName: true,
//                 appliedAt: true,
//                 updatedAt: true,
//                 program: { select: { name: true, level: true } },
//                 intake: { select: { name: true, year: true } },
//             },
//             orderBy: { appliedAt: 'desc' },
//         });

//         res.status(200).json({
//             status: 'success',
//             data: applications,
//         });
//     } catch (error) {
//         res.status(500).json({
//             error: 'Failed to fetch applications',
//             message: error.message,
//         });
//     }
// };

const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const candidateId = req.user.id;

        const application = await prisma.application.fin({
            where: { id: id, candidateId: candidateId },
            include: {
                program: true,
                intake: true,
            },
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.status(200).json({
            status: 'success',
            data: application,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch application',
            message: error.message,
        });
    }
};

const updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { programId, intakeId } = req.body;
        const candidateId = req.user.id;
        const document = req.file;

        const existingApp = await prisma.application.findFirst({
            where: { id: id, candidateId: candidateId },
        });

        if (!existingApp) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (existingApp.status !== 'submitted') {
            return res.status(400).json({ error: 'Cannot update application after submission review' });
        }

        const updateData = {};
        if (programId) updateData.programId = programId;
        if (intakeId) updateData.intakeId = intakeId;
        if (document) {
            updateData.documentData = document.buffer;
            updateData.documentName = document.originalname;
            updateData.documentType = document.mimetype;
        }

        const application = await prisma.application.update({
            where: { id: id },
            data: updateData,
        });

        res.status(200).json({
            status: 'success',
            message: 'Application updated successfully',
            data: {
                id: application.id,
                status: application.status,
                documentName: application.documentName,
                updatedAt: application.updatedAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update application',
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

export { submitApplication, getApplicationById, updateApplication, deleteApplication };