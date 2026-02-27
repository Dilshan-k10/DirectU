import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken.js';

const uniAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const emailParts = email.split('@');
  const domain = emailParts[1]?.toLowerCase();
  const allowedDomain = process.env.UNIVERSITY_ADMIN_EMAIL_DOMAIN;

  if (!allowedDomain) {
    return res.status(500).json({
      error: 'University admin email domain is not configured',
    });
  }

  if (!domain || domain !== allowedDomain.toLowerCase()) {
    return res.status(403).json({
      error: 'Access restricted to organization email domain for university admins',
    });
  }

  const token = generateToken(user.id, res);

  return res.status(200).json({
    status: 'success',
    message: 'University admin login successful',
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
};

const getDashboard = async (req, res) => {
  const degrees = await prisma.degree.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      applications: {
        select: {
          id: true,
          testResult: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const degreeStats = degrees.map((degree) => {
    const totalApplications = degree.applications.length;
    const attemptedExam = degree.applications.filter(
      (application) =>
        application.testResult && application.testResult.status === 'completed'
    ).length;

    return {
      degreeId: degree.id,
      degreeName: degree.name,
      totalApplications,
      attemptedExam,
    };
  });

  return res.status(200).json({
    status: 'success',
    data: {
      degrees: degreeStats,
    },
  });
};


export {
  uniAdminLogin,
  getDashboard,
  getApplicants,
  getApplicantDetail,
  createIntake,
  getIntakes,
};
const getApplicants = async (req, res) => {
  const applicantions = await prisma.application.findMany({
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      program: {
        select: {
          id: true,
          name: true,
        },
      },
      intake: {
        select: {
          id: true,
          name: true,
          year: true,
          startDate: true,
          endDate: true,
        },
      },
      testResult: {
        select: {
          id: true,
          status: true,
          score: true,
          obtainedMarks: true,
          percentage: true,
        },
      },
    },
    orderBy: {
      appliedAt: 'desc',
    },
  });

  const applicants = applications.map((application) => ({
    applicationId: application.id,
    status: application.status,
    appliedAt: application.appliedAt,
    documentPath: application.documentPath,
    documentType: application.documentType,
    candidate: application.candidate,
    degree: application.program,
    intake: application.intake,
    exam: application.testResult
      ? {
          status: application.testResult.status,
          score: application.testResult.score,
          obtainedMarks: application.testResult.obtainedMarks,
          percentage: application.testResult.percentage,
        }
      : null,
  }));  

  return res.status(200).json({
    status: 'success',
    data: {
      applicants,
    },
  });
};


const getApplicantDetail = async (req, res) => {
  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      program: true,
      intake: true,
      cvAnalysisResult: true,
      testResult: {
        include: {
          candidateAnswers: {
            include: {
              question: true,
            },
          },
        },
      }
    },  
  });

  if (!application) {
    return res.status(404).json({
      error: 'Application not found',
    });
  }

  
}

