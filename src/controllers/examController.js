import { prisma } from '../config/db.js';

const getRandomQuestionsByDegree = async (req, res) => {
  try {
    const { degreeId } = req.params;

    // Validate that the degree exists
    const degree = await prisma.degree.findUnique({
      where: { id: degreeId },
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
      where: { degreeId },
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
      data: randomTen,
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

export { getRandomQuestionsByDegree, submitStudentAnswers };

