const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
}

function buildPrompt(degreeName) {
  const guidance = buildDegreeGuidance(degreeName);

  return [
    `Generate exactly 10 realistic multiple-choice questions (MCQs) for a university entrance exam for the degree "${degreeName}".`,
    'Difficulty: medium.',
    guidance,
    'Each question must include: question, 4 options, and the correct answer.',
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
          },
        ],
      },
      null,
      2
    ),
  ].join('\n');
}

function stripCodeFences(text) {
  const s = String(text || '').trim();
  // Remove ```json ... ``` or ``` ... ```
  if (s.startsWith('```')) {
    return s.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```$/m, '').trim();
  }
  return s;
}

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
}

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

  // Sometimes model returns "O(log n)" while options contain same with spacing differences
  const compact = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const idx2 = options.findIndex((o) => compact(o) === compact(answer));
  if (idx2 === 0) return 'A';
  if (idx2 === 1) return 'B';
  if (idx2 === 2) return 'C';
  if (idx2 === 3) return 'D';

  throw new Error('AI answer does not match any option');
}

function validateAndMapQuestions(payload) {
  const questions = payload?.questions;
  if (!Array.isArray(questions) || questions.length !== 10) {
    throw new Error('AI must return exactly 10 questions');
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

    return {
      questionText,
      optionA: oA,
      optionB: oB,
      optionC: oC,
      optionD: oD,
      correctAnswer,
    };
  });
}

export async function generateMcqsForDegree({ degreeName }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt = buildPrompt(degreeName);

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
        temperature: 0.6,
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Gemini API failed (${resp.status}): ${text || resp.statusText}`);
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('\n') || '';

  if (!text) throw new Error('Gemini returned empty response');

  const parsed = parseGeminiJson(text);
  const mapped = validateAndMapQuestions(parsed);
  return mapped;
}

