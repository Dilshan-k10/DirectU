import { prisma } from '../config/db.js';
import { generateMcqsForDegree } from '../services/geminiQuestionService.js';
import { updateDegreeRanking } from '../services/rankingService.js';

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
      select: { id: true, name: true },
    });

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Degree not found',
        data: null,
      });
    }

    // Ensure a testResult exists for locking question assignments (Pattern B)
    let testResult = await prisma.testResult.findUnique({
      where: { applicationId: application.id },
      select: { id: true, status: true, startTime: true },
    });

    if (!testResult) {
      testResult = await prisma.testResult.create({
        data: {
          applicationId: application.id,
          status: 'in_progress',
          startTime: new Date(),
        },
        select: { id: true, status: true, startTime: true },
      });
    } else if (!testResult.startTime) {
      await prisma.testResult.update({
        where: { id: testResult.id },
        data: { startTime: new Date() },
      });
    }

    // If questions are already assigned to this testResult, return the locked set
    const existingAssignments = await prisma.examQuestionAssignment.findMany({
      where: { testResultId: testResult.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        question: {
          select: {
            id: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
          },
        },
      },
    });

    if (existingAssignments.length === 10) {
      return res.status(200).json({
        success: true,
        message: 'Exam questions fetched successfully',
        data: {
          applicationId: application.id,
          degreeId: degree.id,
          applicationStatus: application.status,
          testResultId: testResult.id,
          questions: existingAssignments.map((a) => a.question),
        },
      });
    }

    // Count how many students have already received locked question sets for this degree
    const served = await prisma.examQuestionAssignment.findMany({
      where: {
        testResult: {
          application: {
            programId: degree.id,
          },
        },
      },
      distinct: ['testResultId'],
      select: { testResultId: true },
    });
    const servedCount = served.length;

    // For the first 20 students per degree, generate new AI questions and store them in QuestionBank
    if (servedCount < 20) {
      try {
        const generated = await generateMcqsForDegree({ degreeName: degree.name });

        // Derive degree code from degree.id, e.g. "deg_bda_001" -> "bda"
        let degreeCode = 'gen';
        const match = /^deg_([a-zA-Z]+)_/.exec(degree.id || '');
        if (match && match[1]) {
          degreeCode = match[1].toLowerCase();
        }

        // Find the last question id for this degree in format q_{degreeCode}_{number}
        const lastAiQuestion = await prisma.questionBank.findFirst({
          where: {
            degreeId: degree.id,
            id: {
              startsWith: `q_${degreeCode}_`,
            },
          },
          select: { id: true },
          orderBy: { id: 'desc' },
        });

        let lastNumber = 0;
        if (lastAiQuestion?.id) {
          const parts = String(lastAiQuestion.id).split('_');
          const maybeNum = parts[parts.length - 1];
          const parsed = parseInt(maybeNum, 10);
          if (!Number.isNaN(parsed)) {
            lastNumber = parsed;
          }
        }

        // Create questions with ids: q_{degreeCode}_{NNN}
        const toCreate = generated.map((q, index) => {
          const nextNumber = lastNumber + index + 1;
          const suffix = String(nextNumber).padStart(3, '0');
          const questionId = `q_${degreeCode}_${suffix}`;

          return {
            id: questionId,
            degreeId: degree.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
          };
        });

        await prisma.questionBank.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      } catch (aiError) {
        console.error('AI question generation failed:', aiError);
        return res.status(502).json({
          success: false,
          message: 'Failed to generate exam questions. Please try again later.',
          data: null,
        });
      }
    }

    // Fetch pool for this degree (exclude correct answers)
    const pool = await prisma.questionBank.findMany({
      where: { degreeId: degree.id },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
    });

    if (pool.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          'Not enough questions available for this degree. At least 10 questions are required.',
        data: null,
      });
    }

    // Randomly select 10 questions and lock them for this testResult
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const chosen = pool.slice(0, 10);

    await prisma.examQuestionAssignment.createMany({
      data: chosen.map((q, idx) => ({
        testResultId: testResult.id,
        questionId: q.id,
        order: idx + 1,
        studentId: loggedInUserId,
      })),
      skipDuplicates: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Exam questions fetched successfully',
      data: {
        applicationId: application.id,
        degreeId: degree.id,
        applicationStatus: application.status,
        testResultId: testResult.id,
        questions: chosen,
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

    // Recalculate rankings for this degree (do not block on failure)
    try {
      await updateDegreeRanking(degreeId);
    } catch (rankErr) {
      console.error('Ranking update failed:', rankErr);
    }

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

const recalculateDegreeRankings = async (req, res) => {
  try {
    const { degreeId } = req.params;
    if (!degreeId) {
      return res.status(400).json({
        success: false,
        message: 'degreeId is required',
        data: null,
      });
    }

    await updateDegreeRanking(degreeId);

    return res.status(200).json({
      success: true,
      message: 'Rankings recalculated successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error recalculating rankings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to recalculate rankings',
      data: null,
    });
  }
};


const getStudentRankings = async (req, res) => {
  try {
    const { degreeId } = req.query || {};

    const rankings = await prisma.ranking.findMany({
      where: degreeId ? { degreeId: String(degreeId) } : undefined,
      orderBy: [{ degreeId: 'asc' }, { rank: 'asc' }],
      select: {
        rank: true,
        degreeId: true,
        application: {
          select: {
            candidate: {
              select: {
                id: true,
                name: true,
              },
            },
            testResult: {
              select: {
                obtainedMarks: true,
              },
            },
          },
        },
      },
    });

    if (!rankings || rankings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No rankings found',
        data: null,
      });
    }

    const ranked = rankings.map((row) => ({
      rank: row.rank,
      degreeId: row.degreeId,
      studentId: row.application.candidate.id,
      name: row.application.candidate.name || null,
      score:
        typeof row.application.testResult?.obtainedMarks === 'number'
          ? row.application.testResult.obtainedMarks
          : 0,
    }));

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
  recalculateDegreeRankings,
  getStudentRankings,
};

