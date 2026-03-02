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

export { getRandomQuestionsByDegree };

