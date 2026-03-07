import { prisma } from '../config/db.js';

const getAllApplicants = async (req, res) => {
    const applicants = await prisma.user.findMany({
        where: { role: 'applicant' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return res.status(200).json({
        status: 'success',
        data: {
            applicants,
        },
    });
};

const getAllAdmins = async (req, res) => {
    const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return res.status(200).json({
        status: 'success',
        data: {
            admins,
        },
    });
};

export { getAllApplicants, getAllAdmins };
