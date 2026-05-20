const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const { generateAIFeedback } = require('../utils/aiGenerator');

// POST /api/results/submit - Submit exam
router.post('/submit', protect, async (req, res) => {
  try {
    const { examId, answers, timeTaken, isAutoSubmitted, startedAt } = req.body;

    // Prevent duplicate submissions
    const existing = await Result.findOne({ student: req.user._id, exam: examId });
    if (existing) return res.status(400).json({ message: 'Exam already submitted' });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const questions = await Question.find({ exam: examId }).sort({ questionNumber: 1 });

    // Calculate results
    let correct = 0, wrong = 0, unattempted = 0;
    const processedAnswers = [];
    const weakTopics = [];

    for (const question of questions) {
      const userAnswer = answers[question._id.toString()];
      let isCorrect = false;

      if (!userAnswer) {
        unattempted++;
      } else if (userAnswer === question.correctAnswer) {
        correct++;
        isCorrect = true;
      } else {
        wrong++;
        if (question.topic && !weakTopics.includes(question.topic)) {
          weakTopics.push(question.topic);
        }
      }

      processedAnswers.push({
        question: question._id,
        selectedOption: userAnswer || null,
        isCorrect
      });
    }

    const score = (correct * exam.marksPerQuestion) - (wrong * exam.negativeMarking);
    const totalMarks = exam.totalQuestions * exam.marksPerQuestion;
    const percentage = Math.round((score / totalMarks) * 100 * 10) / 10;
    const xpEarned = Math.max(0, Math.round(percentage * 2));

    // Generate grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    // Generate AI feedback
    const aiFeedback = await generateAIFeedback({
      examTitle: exam.title,
      score: Math.max(0, score),
      percentage: Math.max(0, percentage),
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattempted,
      totalQuestions: exam.totalQuestions,
      weakTopics
    });

    const result = await Result.create({
      student: req.user._id,
      exam: examId,
      batch: req.user.batch,
      answers: processedAnswers,
      score: Math.max(0, score),
      totalMarks,
      percentage: Math.max(0, percentage),
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattempted,
      timeTaken: timeTaken || 0,
      grade,
      xpEarned,
      isAutoSubmitted: isAutoSubmitted || false,
      aiFeedback,
      startedAt: startedAt ? new Date(startedAt) : undefined
    });

    // Update user XP and stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { xpPoints: xpEarned },
      lastActive: new Date()
    });

    // Update XP level
    const user = await User.findById(req.user._id);
    user.level = Math.floor(user.xpPoints / 100) + 1;
    if (percentage >= 80 && !user.badges.includes('High Achiever')) user.badges.push('High Achiever');
    if (correct === exam.totalQuestions && !user.badges.includes('Perfect Score')) user.badges.push('Perfect Score');
    await user.save();

    res.status(201).json({
      result,
      xpEarned,
      grade,
      message: 'Exam submitted successfully!'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/my - Student's own results
router.get('/my', protect, async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('exam', 'title domain difficulty totalQuestions marksPerQuestion')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/:id - Get specific result with detailed answers
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('exam', 'title domain difficulty totalQuestions marksPerQuestion negativeMarking')
      .populate('student', 'name email');

    if (!result) return res.status(404).json({ message: 'Result not found' });

    // Populate answers with questions (including correct answers for review)
    const populatedAnswers = await Promise.all(
      result.answers.map(async (ans) => {
        const question = await Question.findById(ans.question);
        return { ...ans.toObject(), questionData: question };
      })
    );

    res.json({ ...result.toObject(), answers: populatedAnswers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/exam/:examId - All results for an exam (admin)
router.get('/exam/:examId', protect, adminOnly, async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.examId })
      .populate('student', 'name email xpPoints level')
      .populate('batch', 'name')
      .sort({ score: -1, timeTaken: 1 });

    const ranked = results.map((r, i) => ({ ...r.toObject(), rank: i + 1 }));
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
