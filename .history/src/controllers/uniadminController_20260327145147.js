import { prisma } from '../config/db.js';

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

const getApplicants = async (req, res) => {
  const applications = await prisma.application.findMany({
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
    },
  });

  if (!application) {
    return res.status(404).json({
      error: 'Application not found',
    });
  }

  return res.status(200).json({
    status: 'success',
    data: {
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
        documentPath: application.documentPath,
        documentType: application.documentType,
      },
      candidate: application.candidate,
      degree: {
        id: application.program.id,
        name: application.program.name,
      },
      intake: {
        id: application.intake.id,
        name: application.intake.name,
        year: application.intake.year,
        startDate: application.intake.startDate,
        endDate: application.intake.endDate,
      },
      cv: {
        documentPath: application.documentPath,
        analysis: application.cvAnalysisResult,
      },
    },
  });
};

const getApplicantExamDetail = async (req, res) => {
  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      testResult: {
        include: {
          candidateAnswers: {
            include: {
              question: true,
            },
          },
        },
      },
    },
  });

  if (!application) {
    return res.status(404).json({
      error: 'Application not found',
    });
  }

  const testResult = application.testResult;

  if (!testResult) {
    return res.status(200).json({
      status: 'success',
      data: {
        exam: null,
      },
    });
  }

  const questions = testResult.candidateAnswers.map((answer) => ({
    answerId: answer.id,
    questionId: answer.questionId,
    questionText: answer.question.questionText,
    options: {
      A: answer.question.optionA,
      B: answer.question.optionB,
      C: answer.question.optionC,
      D: answer.question.optionD,
    },
    selectedOption: answer.selectedOption,
    correctAnswer: answer.question.correctAnswer,
    isCorrect: answer.isCorrect,
    isFlagged: answer.isFlagged,
  }));

  return res.status(200).json({
    status: 'success',
    data: {
      exam: {
        id: testResult.id,
        status: testResult.status,
        startTime: testResult.startTime,
        endTime: testResult.endTime,
        score: testResult.score,
        obtainedMarks: testResult.obtainedMarks,
        percentage: testResult.percentage,
        questions,
      },
    },
  });
};

const createIntake = async (req, res) => {
  const { name, year, startDate, endDate } = req.body;

  if (!name || !year || !startDate || !endDate) {
    return res.status(400).json({
      error: 'name, year, startDate and endDate are required',
    });
  }

  const intake = await prisma.intake.create({
    data: {
      name,
      year: Number(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return res.status(201).json({
    status: 'success',
    message: 'Intake created successfully',
    data: {
      intake,
    },
  });
};

const updateIntake = async (req, res) => {
  const { intakeId } = req.params;
  const { name, year, startDate, endDate } = req.body;

  if (!name && !year && !startDate && !endDate) {
    return res.status(400).json({
      error: 'At least one field (name, year, startDate, endDate) is required to update',
    });
  }

  const existingIntake = await prisma.intake.findUnique({
    where: { id: intakeId },
  });

  if (!existingIntake) {
    return res.status(404).json({
      error: 'Intake not found',
    });
  }

  const data = {};

  if (name !== undefined) data.name = name;
  if (year !== undefined) data.year = Number(year);
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = new Date(endDate);

  const updatedIntake = await prisma.intake.update({
    where: { id: intakeId },
    data,
  });

  return res.status(200).json({
    status: 'success',
    message: 'Intake updated successfully',
    data: {
      intake: updatedIntake,
    },
  });
};

const getIntakes = async (req, res) => {
  const intakes = await prisma.intake.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.status(200).json({
    status: 'success',
    data: {
      intakes,
    },
  });
};

const createDegree = async (req, res) => {
  const { name, description, level, duration, capacity, isActive } = req.body;

  if (!name || !level || !duration) {
    return res.status(400).json({
      error: 'name, level and duration are required',
    });
  }

  const degree = await prisma.degree.create({
    data: {
      name,
      description: description || null,
      level,
      duration: Number(duration),
      capacity: capacity !== undefined ? Number(capacity) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      createdBy: req.user.id,
    },
  });

  return res.status(201).json({
    status: 'success',
    message: 'Degree created successfully',
    data: {
      degree,
    },
  });
};

const getDegrees = async (req, res) => {
  const degrees = await prisma.degree.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.status(200).json({
    status: 'success',
    data: {
      degrees,
    },
  });
};

const updateDegree = async (req, res) => {
  const { degreeId } = req.params;
  const { name, description, level, duration, capacity, isActive } = req.body;

  if (
    name === undefined &&
    description === undefined &&
    level === undefined &&
    duration === undefined &&
    capacity === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      error: 'At least one field must be provided to update the degree',
    });
  }

  const existingDegree = await prisma.degree.findUnique({
    where: { id: degreeId },
  });

  if (!existingDegree) {
    return res.status(404).json({
      error: 'Degree not found',
    });
  }

  const data = {};

  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (level !== undefined) data.level = level;
  if (duration !== undefined) data.duration = Number(duration);
  if (capacity !== undefined) data.capacity = Number(capacity);
  if (isActive !== undefined) data.isActive = Boolean(isActive);

  const updatedDegree = await prisma.degree.update({
    where: { id: degreeId },
    data,
  });

  return res.status(200).json({
    status: 'success',
    message: 'Degree updated successfully',
    data: {
      degree: updatedDegree,
    },
  });
};

const getApplicantanalysisResultById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await prisma.cVAnalysisResult.findUnique({
      where: { applicationId },
      select: {
        id: true,
        applicationId: true,
        extractedData: true,
        qualificationMatch: true,
        confidenceScore: true,
        analysisStatus: true,
        errorMessage: true,
        analyzedAt: true,
        createdAt: true,
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'CV analysis result not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'An error occurred while fetching CV analysis result',
      details: error.message,
    });
  }
};





export {
  getDashboard,
  getApplicants,
  getApplicantDetail,
  getApplicantExamDetail,
  createIntake,
  updateIntake,
  getIntakes,
  createDegree,
  getDegrees,
  updateDegree,
  getApplicantanalysisResultById,
};