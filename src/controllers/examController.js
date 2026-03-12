import { prisma } from '../config/db.js';

const getRandomQuestionsByDegree = async (req, res) => {
  try {
    const { degreeId } = req.params;

    // Ensure the request is authenticated and we have a logged-in user
    const loggedInUserId = req.user?.id;
    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        data: null,
      });
    }

    // Find the latest application for this logged-in user and degree
    const application = await prisma.application.findFirst({
      where: {
        candidateId: loggedInUserId,
        programId: degreeId,
      },
      orderBy: {
        appliedAt: 'desc',
      },
      select: {
        id: true,
        programId: true,
        status: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this degree for the logged-in user',
        data: null,
      });
    }

    // Only release exam if application status is "qualified"
    if (application.status !== 'qualified') {
      return res.status(403).json({
        success: false,
        message: 'Exam not available. Application is not qualified',
        data: {
          applicationId: application.id,
          degreeId: application.programId,
          applicationStatus: application.status,
        },
      });
    }

    // Validate that the degree exists (based on application.programId)
    const degree = await prisma.degree.findUnique({
      where: { id: application.programId },
    });

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Degree not found',
        data: null,
      });
    }

    // Fetch all questions related to that degree (exclude correct answers)
    const questions = await prisma.questionBank.findMany({
      where: { degreeId: application.programId },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
    });

    // If less than 10 questions available → validation error
    if (questions.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          'Not enough questions available for this degree. At least 10 questions are required.',
        data: null,
      });
    }

    // Randomly select EXACTLY 10 questions (Fisher–Yates shuffle in controller)
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    const randomTen = questions.slice(0, 10);

    return res.status(200).json({
      success: true,
      message: 'Random questions fetched successfully',
      data: {
        applicationId: application.id,
        degreeId: application.programId,
        applicationStatus: application.status,
        questions: randomTen,
      },
    });
  } catch (error) {
    console.error('Error fetching random questions by degree:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch random questions',
      data: null,
    });
  }
};

const submitStudentAnswers = async (req, res) => {
  try {
    const { studentId, degreeId, answers } = req.body;

    if (!studentId || !degreeId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentId, degreeId and answers are required',
        data: null,
      });
    }

    // 1. Validate student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        data: null,
      });
    }

    // 2. Validate degree exists
    const degree = await prisma.degree.findUnique({
      where: { id: degreeId },
      select: { id: true },
    });

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Degree not found',
        data: null,
      });
    }

    // Basic answers validation + normalization
    const normalizedAnswers = [];
    for (let i = 0; i < answers.length; i++) {
      const entry = answers[i];
      const questionId = entry?.questionId;
      const selectedAnswer = entry?.selectedAnswer;

      if (!questionId || typeof selectedAnswer !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Each answer must include questionId and selectedAnswer',
          data: null,
        });
      }

      const normalizedSelected = selectedAnswer.trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(normalizedSelected)) {
        return res.status(400).json({
          success: false,
          message: 'selectedAnswer must be one of A, B, C, D',
          data: null,
        });
      }

      normalizedAnswers.push({
        questionId,
        selectedAnswer: normalizedSelected,
      });
    }

    const questionIds = normalizedAnswers.map((a) => a.questionId);
    const uniqueQuestionIds = [...new Set(questionIds)];
    if (uniqueQuestionIds.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate questionId found in answers',
        data: null,
      });
    }

    // 3 & 4. Validate questions belong to degree + fetch correct answers
    const questions = await prisma.questionBank.findMany({
      where: {
        id: { in: uniqueQuestionIds },
        degreeId,
      },
      select: {
        id: true,
        correctAnswer: true,
      },
    });

    if (questions.length !== uniqueQuestionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more questions are invalid for this degree',
        data: null,
      });
    }

    const correctAnswerByQuestionId = new Map(
      questions.map((q) => [q.id, (q.correctAnswer || '').trim().toUpperCase()])
    );

    // Find the student's application for this degree
    const application = await prisma.application.findFirst({
      where: {
        candidateId: studentId,
        programId: degreeId,
      },
      orderBy: {
        appliedAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found for this student and degree',
        data: null,
      });
    }

    // Ensure testResult exists (CandidateAnswer requires testResultId)
    let testResult = await prisma.testResult.findUnique({
      where: { applicationId: application.id },
      select: { id: true, status: true },
    });

    if (!testResult) {
      testResult = await prisma.testResult.create({
        data: {
          applicationId: application.id,
          status: 'completed',
          endTime: new Date(),
        },
        select: { id: true, status: true },
      });
    } else if (testResult.status !== 'completed') {
      await prisma.testResult.update({
        where: { id: testResult.id },
        data: {
          status: 'completed',
          endTime: new Date(),
        },
      });
    }

    // 5, 6, 7. Compare & save (no total score calculation, no correct answers in response)
    const ops = normalizedAnswers.map((a) => {
      const correctAnswer = correctAnswerByQuestionId.get(a.questionId);
      const isCorrect = a.selectedAnswer === correctAnswer;

      return prisma.candidateAnswer.upsert({
        where: {
          testResultId_questionId: {
            testResultId: testResult.id,
            questionId: a.questionId,
          },
        },
        update: {
          selectedOption: a.selectedAnswer,
          isCorrect,
        },
        create: {
          testResultId: testResult.id,
          questionId: a.questionId,
          selectedOption: a.selectedAnswer,
          isCorrect,
        },
      });
    });

    await prisma.$transaction(ops);

    return res.status(200).json({
      success: true,
      message: 'Answers submitted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error submitting student answers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answers',
      data: null,
    });
  }
};

const calculateFinalScoreAndSave = async (req, res) => {
  try {
    const { studentId, degreeId } = req.body;

    if (!studentId || !degreeId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and degreeId are required',
        data: null,
      });
    }

    // Validate student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        data: null,
      });
    }

    // Validate degree exists
    const degree = await prisma.degree.findUnique({
      where: { id: degreeId },
      select: { id: true },
    });

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Degree not found',
        data: null,
      });
    }

    // Find the student's latest application for this degree
    const application = await prisma.application.findFirst({
      where: {
        candidateId: studentId,
        programId: degreeId,
      },
      orderBy: {
        appliedAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found for this student and degree',
        data: null,
      });
    }

    // Fetch test result with all candidate answers
    const testResult = await prisma.testResult.findUnique({
      where: { applicationId: application.id },
      include: {
        candidateAnswers: {
          select: {
            isCorrect: true,
          },
        },
      },
    });

    if (!testResult || !testResult.candidateAnswers || testResult.candidateAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No submitted answers found for this student and degree',
        data: null,
      });
    }

    // Calculate total score: 10 marks per correct answer
    let correctCount = 0;
    for (let i = 0; i < testResult.candidateAnswers.length; i++) {
      const answer = testResult.candidateAnswers[i];
      if (answer.isCorrect === true) {
        correctCount += 1;
      }
    }

    const totalScore = correctCount * 10;

    // Save total score using existing attributes (no schema changes)
    const updatedResult = await prisma.testResult.update({
      where: { id: testResult.id },
      data: {
        obtainedMarks: totalScore,
      },
      select: {
        id: true,
        obtainedMarks: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Final score calculated and saved successfully',
      data: {
        totalScore: updatedResult.obtainedMarks,
      },
    });
  } catch (error) {
    console.error('Error calculating final score:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate final score',
      data: null,
    });
  }
};


const getStudentRankings = async (req, res) => {
  try {
    // Fetch all completed results that have a stored final score
    const results = await prisma.testResult.findMany({
      where: {
        status: 'completed',
        obtainedMarks: { not: null },
      },
      select: {
        obtainedMarks: true,
        application: {
          select: {
            candidate: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!results || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No exam results found',
        data: null,
      });
    }

    // Reduce to best score per student (dynamic ranking is per student)
    const bestByStudentId = new Map();
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const candidate = row?.application?.candidate;
      if (!candidate?.id) continue;

      const score = typeof row.obtainedMarks === 'number' ? row.obtainedMarks : 0;
      const existing = bestByStudentId.get(candidate.id);

      if (!existing || score > existing.score) {
        bestByStudentId.set(candidate.id, {
          studentId: candidate.id,
          name: candidate.name || null,
          score,
        });
      }
    }

    const rankingList = Array.from(bestByStudentId.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.studentId).localeCompare(String(b.studentId));
    });

    // Assign dense ranks (ties share the same rank)
    let rank = 0;
    let lastScore = null;
    const ranked = rankingList.map((entry) => {
      if (lastScore === null || entry.score !== lastScore) {
        rank += 1;
        lastScore = entry.score;
      }

      return {
        rank,
        studentId: entry.studentId,
        name: entry.name,
        score: entry.score,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Student rankings fetched successfully',
      data: ranked,
    });
  } catch (error) {
    console.error('Error fetching student rankings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student rankings',
      data: null,
    });
  }
};

export {
  getRandomQuestionsByDegree,
  submitStudentAnswers,
  calculateFinalScoreAndSave,
  getStudentRankings,
};

