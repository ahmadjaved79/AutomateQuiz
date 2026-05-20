const https = require('https');

// Free models to try in order (fallbacks)
const FREE_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2-7b-instruct:free'
];

// Native https-based fetch to avoid node-fetch dependency issues
const httpsPost = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, text: () => raw, json: () => JSON.parse(raw) });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timeout after 30s'));
    });

    req.write(data);
    req.end();
  });
};

const callOpenRouter = async (prompt, modelIndex = 0) => {
  if (modelIndex >= FREE_MODELS.length) {
    throw new Error('All AI models failed. Please check your OpenRouter API key.');
  }

  const model = FREE_MODELS[modelIndex];
  console.log(`🤖 Trying model: ${model}`);

  let response;
  try {
    response = await httpsPost(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'QuizMaster AI'
      },
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      }
    );
  } catch (netErr) {
    console.error(`❌ Network error for model ${model}:`, netErr.message);
    return callOpenRouter(prompt, modelIndex + 1);
  }

  if (response.status < 200 || response.status >= 300) {
    const errText = response.text();
    console.error(`❌ Model ${model} failed: ${response.status} - ${errText}`);
    return callOpenRouter(prompt, modelIndex + 1);
  }

  let data;
  try {
    data = response.json();
  } catch (parseErr) {
    console.error(`❌ Model ${model} returned invalid JSON:`, parseErr.message);
    return callOpenRouter(prompt, modelIndex + 1);
  }

  if (data.error) {
    console.error(`❌ Model ${model} API error:`, data.error);
    return callOpenRouter(prompt, modelIndex + 1);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || content.trim() === '') {
    console.error(`❌ Model ${model} returned empty content`);
    return callOpenRouter(prompt, modelIndex + 1);
  }

  return content;
};

const parseQuestionsFromText = (text) => {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error('Could not find JSON array in AI response');
  }

  let parsed;
  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch (e) {
    const fixed = arrayMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"');
    parsed = JSON.parse(fixed);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI returned empty questions array');
  }

  return parsed;
};

const generateQuestions = async ({ title, domain, description, difficulty, count }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openrouter_api_key_here') {
    console.warn('⚠️  No OpenRouter API key — using fallback questions');
    return generateFallbackQuestions({ domain, difficulty, count });
  }

  const prompt = `Generate exactly ${count} multiple choice questions for a ${difficulty} level exam on "${domain}" (${title}).
${description ? `Context: ${description}` : ''}

Rules:
- Return ONLY a valid JSON array, no explanation, no markdown
- Each object must have: questionNumber, questionText, options (object with A/B/C/D keys), correctAnswer (A/B/C/D), topic, difficulty

Example format:
[{"questionNumber":1,"questionText":"What is...?","options":{"A":"opt1","B":"opt2","C":"opt3","D":"opt4"},"correctAnswer":"A","topic":"basics","difficulty":"${difficulty}"}]

Generate all ${count} questions now as a JSON array:`;

  try {
    const rawContent = await callOpenRouter(prompt);
    const questions = parseQuestionsFromText(rawContent);

    const valid = questions
      .filter(q => q.questionText && q.options && q.correctAnswer && ['A', 'B', 'C', 'D'].includes(String(q.correctAnswer).toUpperCase()))
      .map((q, i) => ({
        questionNumber: q.questionNumber || i + 1,
        questionText: String(q.questionText).trim(),
        options: {
          A: String(q.options.A || '').trim(),
          B: String(q.options.B || '').trim(),
          C: String(q.options.C || '').trim(),
          D: String(q.options.D || '').trim()
        },
        correctAnswer: String(q.correctAnswer).toUpperCase(),
        topic: q.topic || domain,
        difficulty: q.difficulty || difficulty,
        explanation: q.explanation || ''
      }));

    if (valid.length === 0) throw new Error('No valid questions after parsing');

    if (valid.length < count) {
      console.warn(`⚠️  Got ${valid.length}/${count} questions, padding with fallback`);
      const fallback = generateFallbackQuestions({ domain, difficulty, count: count - valid.length });
      return [...valid, ...fallback.map((q, i) => ({ ...q, questionNumber: valid.length + i + 1 }))];
    }

    console.log(`✅ Generated ${valid.length} questions via AI`);
    return valid.slice(0, count);

  } catch (err) {
    console.error('❌ AI generation error:', err.message);
    console.warn('⚠️  Falling back to template questions');
    return generateFallbackQuestions({ domain, difficulty, count });
  }
};

// Fallback question bank when AI is unavailable
const generateFallbackQuestions = ({ domain, difficulty, count }) => {
  const banks = {
    'Mathematics': [
      { q: 'What is the derivative of sin(x)?', opts: ['cos(x)', '-cos(x)', 'tan(x)', '-sin(x)'], ans: 'A', topic: 'Calculus' },
      { q: 'What is the value of π (pi) approximately?', opts: ['3.14159', '2.71828', '1.61803', '1.41421'], ans: 'A', topic: 'Constants' },
      { q: 'What is the integral of 1/x dx?', opts: ['ln|x| + C', 'x²/2 + C', '1/x² + C', 'e^x + C'], ans: 'A', topic: 'Calculus' },
      { q: 'If A is a 3×3 matrix, what is the maximum rank?', opts: ['3', '6', '9', '1'], ans: 'A', topic: 'Linear Algebra' },
      { q: 'What is the sum of angles in a triangle?', opts: ['180°', '90°', '360°', '270°'], ans: 'A', topic: 'Geometry' },
    ],
    'Physics': [
      { q: "What is Newton's second law of motion?", opts: ['F = ma', 'E = mc²', 'F = mv', 'P = mv'], ans: 'A', topic: 'Mechanics' },
      { q: 'What is the SI unit of electric current?', opts: ['Ampere', 'Volt', 'Ohm', 'Watt'], ans: 'A', topic: 'Electricity' },
      { q: 'What is the speed of light in vacuum?', opts: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], ans: 'A', topic: 'Optics' },
      { q: 'Which law states energy cannot be created or destroyed?', opts: ['First Law of Thermodynamics', 'Second Law', "Newton's Law", "Ohm's Law"], ans: 'A', topic: 'Thermodynamics' },
      { q: 'What is the formula for kinetic energy?', opts: ['½mv²', 'mgh', 'mv', 'F×d'], ans: 'A', topic: 'Mechanics' },
    ],
    'Computer Science': [
      { q: 'What does CPU stand for?', opts: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Core Processing Unit'], ans: 'A', topic: 'Hardware' },
      { q: 'Which data structure uses LIFO order?', opts: ['Stack', 'Queue', 'Array', 'Tree'], ans: 'A', topic: 'Data Structures' },
      { q: 'What is the time complexity of binary search?', opts: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'], ans: 'A', topic: 'Algorithms' },
      { q: 'What does SQL stand for?', opts: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Structured Question Language'], ans: 'A', topic: 'Databases' },
      { q: 'Which sorting algorithm has best average time complexity?', opts: ['Merge Sort O(n log n)', 'Bubble Sort O(n²)', 'Selection Sort O(n²)', 'Insertion Sort O(n²)'], ans: 'A', topic: 'Algorithms' },
    ],
    'Chemistry': [
      { q: 'What is the atomic number of Carbon?', opts: ['6', '12', '8', '14'], ans: 'A', topic: 'Atomic Structure' },
      { q: 'What is the chemical formula of water?', opts: ['H₂O', 'H₂O₂', 'HO', 'H₂O₃'], ans: 'A', topic: 'Compounds' },
      { q: 'What is the pH of a neutral solution?', opts: ['7', '0', '14', '1'], ans: 'A', topic: 'Acids and Bases' },
      { q: 'Which gas is responsible for the greenhouse effect?', opts: ['CO₂', 'O₂', 'N₂', 'H₂'], ans: 'A', topic: 'Environmental Chemistry' },
      { q: 'What is the valency of Oxygen?', opts: ['2', '1', '3', '4'], ans: 'A', topic: 'Valency' },
    ],
  };

  const genericBank = [
    { q: `Which best describes the core concept of ${domain}?`, opts: ['Systematic study of principles', 'Random experimentation', 'Theoretical assumptions only', 'Practical applications only'], ans: 'A', topic: domain },
    { q: `What is the primary goal of studying ${domain}?`, opts: ['Problem solving and understanding', 'Memorization of facts', 'Following instructions', 'Avoiding challenges'], ans: 'A', topic: domain },
    { q: `Which approach is most effective when learning ${domain}?`, opts: ['Practice with examples', 'Reading only', 'Watching videos only', 'Skipping basics'], ans: 'A', topic: domain },
    { q: `In ${domain}, what does systematic analysis help achieve?`, opts: ['Better understanding', 'Confusion', 'Slower progress', 'Irrelevant results'], ans: 'A', topic: domain },
    { q: `What is essential for mastering ${domain}?`, opts: ['Consistent practice', 'Guesswork', 'Avoiding difficult topics', 'Skipping fundamentals'], ans: 'A', topic: domain },
  ];

  const bank = banks[domain] || genericBank;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const template = bank[i % bank.length];
    questions.push({
      questionNumber: i + 1,
      questionText: template.q,
      options: { A: template.opts[0], B: template.opts[1], C: template.opts[2], D: template.opts[3] },
      correctAnswer: template.ans,
      topic: template.topic || domain,
      difficulty,
      explanation: `Correct answer is ${template.ans}: ${template.opts[0]}`
    });
  }

  return questions;
};

const generateAIFeedback = async ({ examTitle, score, percentage, correctAnswers, wrongAnswers, unattempted, totalQuestions, weakTopics }) => {
  const defaultFeedback = () => ({
    strengths: percentage >= 60
      ? ['Good performance overall', 'Consistent attempt rate', 'Strong conceptual understanding']
      : ['Attempted all questions', 'Showed effort in completing the exam'],
    weakAreas: percentage < 60
      ? ['Review core fundamentals', 'Practice more varied questions', 'Focus on weak topics']
      : [],
    suggestions: ['Review incorrect answers carefully', 'Practice topic-wise questions daily', 'Take more timed mock tests', 'Focus on understanding concepts, not memorization'],
    summary: percentage >= 80
      ? `Excellent work! You scored ${percentage}% demonstrating strong mastery. Keep up the great momentum!`
      : percentage >= 60
        ? `Good job! You scored ${percentage}%. With targeted practice on weak areas, you can reach the next level.`
        : `You scored ${percentage}%. Don't be discouraged — review the fundamentals and practice regularly. Every attempt makes you stronger!`
  });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openrouter_api_key_here') {
    return defaultFeedback();
  }

  const prompt = `Analyze this student exam result and give feedback as JSON only (no markdown):

Exam: ${examTitle}
Score: ${score}/${totalQuestions} (${percentage}%)
Correct: ${correctAnswers}, Wrong: ${wrongAnswers}, Skipped: ${unattempted}
Weak Topics: ${weakTopics.join(', ') || 'N/A'}

Return exactly this JSON structure:
{"strengths":["str1","str2"],"weakAreas":["area1","area2"],"suggestions":["tip1","tip2","tip3"],"summary":"2 sentence motivational summary"}`;

  try {
    const content = await callOpenRouter(prompt);
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return defaultFeedback();
  } catch (err) {
    console.error('AI feedback error:', err.message);
    return defaultFeedback();
  }
};

module.exports = { generateQuestions, generateAIFeedback };