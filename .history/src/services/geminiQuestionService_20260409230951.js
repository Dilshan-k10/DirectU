/**
 * Gemini AI Question Generation Service
 *
 * This module provides functionality to generate multiple-choice questions (MCQs)
 * for university entrance exams using Google's Gemini AI model.
 *
 * Key functionalities:
 * - Generates exactly 30 balanced MCQs per degree (40% easy, 40% medium, 20% hard)
 * - Provides degree-specific guidance for appropriate question difficulty
 * - Handles API communication with Gemini 2.5 Flash model
 * - Validates and normalizes AI-generated content
 * - Ensures consistent question format and answer validation
 */

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Builds degree-specific guidance for question generation.
 *
 * Provides contextual instructions based on the degree name to ensure
 * questions are appropriate for entrance exam level rather than advanced university topics.
 *
 * @param {string} degreeName - Name of the degree program
 * @returns {string} Guidance text for AI question generation
 */
function buildDegreeGuidance(degreeName) {
  const name = String(degreeName || '').toLowerCase();

  if (name.includes('computer') || name.includes('computing') || name.includes('cs')) {
    return (
      'Focus on maths, logic, reasoning, IQ-style questions, basic algorithms/data representation at a high-school level. ' +
      'Avoid advanced university-level CS topics.'
    );
  }

  if (name.includes('software') || name.includes('se') || name.includes('information technology') || name.includes('it')) {
    return (
      'Focus on A/L or high-school level IT concepts, logical reasoning, basic programming understanding, IQ/EQ reasoning. ' +
      'Avoid advanced software architecture and deep university topics.'
    );
  }

  return (
    'Focus on realistic, general entrance-exam questions related to the degree field. ' +
    'Avoid overly technical, specialized, or advanced university-level questions.'
  );
/**
 * Constructs the complete prompt for Gemini AI to generate MCQs.
 *
 * Combines degree guidance with specific formatting requirements
 * to ensure consistent, valid JSON output from the AI model.
 *
 * @param {string} degreeName - Name of the degree program
 * @returns {string} Complete prompt text for AI generation
 */
  function buildPrompt(degreeName) {
    const guidance = buildDegreeGuidance(degreeName);

    return [
      `Generate exactly 30 realistic multiple-choice questions (MCQs) for a university entrance exam for the degree "${degreeName}".`,
      'Balance the difficulties: approximately 40% easy, 40% medium, 20% hard.',
      guidance,
      'Each question must include: question, 4 options, the correct answer, and difficulty level (EASY, MEDIUM, or HARD).',
      'Return ONLY valid JSON (no markdown, no code fences, no extra text).',
      'JSON format:',
      JSON.stringify(
        {
          degree: degreeName,
          questions: [
            {
              question: 'Question text',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              answer: 'Option B',
              difficulty: 'MEDIUM',
            },
          ],
        },
        null,
        2
      ),
    ].join('\n');
  }
/**
 * Removes markdown code fences from AI response text.
 *
 * Gemini may wrap JSON responses in ```json or ``` blocks,
 * this function strips those markers to get clean JSON.
 *
 * @param {string} text - Raw text from AI response
 * @returns {string} Text with code fences removed
 */
function stripCodeFences(text) {
  const s = String(text || '').trim();
  // Remove ```json ... ``` or ``` ... ```
  if (s.startsWith('```')) {
    return s.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```$/m, '').trim();
  }
  return s;
/**
 * Parses JSON response from Gemini AI.
 *
 * Handles potential extra text or formatting issues by attempting
 * to extract the first valid JSON object from the response.
 *
 * @param {string} rawText - Raw response text from Gemini API
 * @returns {Object} Parsed JSON object
 * @throws {Error} If JSON parsing fails
 */
function parseGeminiJson(rawText) {
  const cleaned = stripCodeFences(rawText);

  // Try parse full string first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting the first JSON object substring
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw new Error('Invalid JSON returned by AI');
  }
/**
 * Normalizes the correct answer from AI response to A, B, C, or D format.
 *
 * Handles various answer formats from AI (letter format, full text matching)
 * and converts them to standardized letter format.
 *
 * @param {string} answerRaw - Raw answer text from AI
 * @param {Array<string>} optionsRaw - Array of option texts
 * @returns {string} Normalized answer letter (A, B, C, or D)
 * @throws {Error} If answer cannot be matched to any option
 */
function normalizeCorrectAnswer(answerRaw, optionsRaw) {
  const answer = String(answerRaw || '').trim();
  const options = Array.isArray(optionsRaw) ? optionsRaw.map((o) => String(o || '').trim()) : [];

  const asLetter = answer.toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(asLetter)) return asLetter;

  const idx = options.findIndex((o) => o.toLowerCase() === answer.toLowerCase());
  if (idx === 0) return 'A';
  if (idx === 1) return 'B';
  if (idx === 2) return 'C';
  if (idx === 3) return 'D';

  
  const compact = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const idx2 = options.findIndex((o) => compact(o) === compact(answer));
  if (idx2 === 0) return 'A';
  if (idx2 === 1) return 'B';
  if (idx2 === 2) return 'C';
  if (idx2 === 3) return 'D';

  throw new Error('AI answer does not match any option');
/**
 * Validates and maps AI-generated questions to standardized format.
 *
 * Ensures all questions have required fields, exactly 4 options,
 * and valid difficulty levels. Converts AI response format to
 * database-compatible question objects.
 *
 * @param {Object} payload - Parsed JSON payload from AI
 * @returns {Array<Object>} Array of validated question objects
 * @throws {Error} If validation fails for any question
 */
function validateAndMapQuestions(payload) {
  const questions = payload?.questions;
  if (!Array.isArray(questions) || questions.length !== 30) {
    throw new Error('AI must return exactly 30 questions');
  }

  return questions.map((q, i) => {
    const questionText = String(q?.question || '').trim();
    const options = q?.options;
    if (!questionText) throw new Error(`Question ${i + 1} is missing text`);
    if (!Array.isArray(options) || options.length !== 4) {
      throw new Error(`Question ${i + 1} must include 4 options`);
    }

    const oA = String(options[0] || '').trim();
    const oB = String(options[1] || '').trim();
    const oC = String(options[2] || '').trim();
    const oD = String(options[3] || '').trim();
    if (!oA || !oB || !oC || !oD) throw new Error(`Question ${i + 1} has empty option(s)`);

    const correctAnswer = normalizeCorrectAnswer(q?.answer, options);

    const difficultyRaw = String(q?.difficulty || '').trim().toUpperCase();
    let difficulty = 'MEDIUM'; // default
    if (['EASY', 'MEDIUM', 'HARD'].includes(difficultyRaw)) {
      difficulty = difficultyRaw;
    }

    return {
      questionText,
      optionA: oA,
      optionB: oB,
      optionC: oC,
      optionD: oD,
      correctAnswer,
      difficulty,
    };
  });
/**
 * Generates 30 multiple-choice questions for a degree using Gemini AI.
 *
 * Main entry point for question generation:
 * - Validates API key configuration
 * - Constructs appropriate prompt for the degree
 * - Calls Gemini API with optimized parameters
 * - Parses and validates the response
 * - Returns standardized question objects ready for database insertion
 *
 * @param {Object} params - Parameters object
 * @param {string} params.degreeName - Name of the degree program
 * @returns {Promise<Array<Object>>} Promise resolving to array of 30 question objects
 * @throws {Error} If API key is missing, API call fails, or response validation fails
 */
export async function generateMcqsForDegree({ degreeName }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt = buildPrompt(degreeName);

  // Call Gemini API with structured request for consistent JSON output
  const resp = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6, // Balanced creativity for question variety
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const message = `Gemini API failed (${resp.status}): ${text || resp.statusText}`;
    if (resp.status === 403) {
      throw new Error(
        `${message} Please verify your GEMINI_API_KEY is valid and has access to the Gemini API.`
      );
    }
    throw new Error(message);
  }

  const data = await resp.json();
  // Extract text content from Gemini's structured response format
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('\n') || '';

  if (!text) throw new Error('Gemini returned empty response');

  // Parse and validate the AI-generated questions
  const parsed = parseGeminiJson(text);
  const mapped = validateAndMapQuestions(parsed);
  return mapped;
}

