const express = require('express');
const router = express.Router();
const https = require('https');
const { protect, adminOnly } = require('../middleware/auth');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Batch = require('../models/Batch');
const Result = require('../models/Result');
const { generateQuestions } = require('../utils/aiGenerator');

// ─── IMPORTANT: Static routes MUST come before /:id param routes ───

// GET /api/exams/admin/all - Admin get all exams
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('batches', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    console.error('GET /admin/all error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/exams - Get exams for student
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      if (!req.user.batch) {
        return res.json([]);
      }
      const batch = await Batch.findById(req.user.batch).populate('exams.exam');
      if (!batch) return res.json([]);

      const examIds = batch.exams.map(e => e.exam?._id).filter(Boolean);
      query = { _id: { $in: examIds }, isActive: true };
    }

    const exams = await Exam.find(query)
      .populate('batches', 'name')
      .select('-questions')
      .sort({ startTime: -1 });

    if (req.user.role === 'student') {
      const results = await Result.find({ student: req.user._id }).select('exam');
      const attemptedExamIds = results.map(r => r.exam.toString());

      const examsWithStatus = exams.map(exam => {
        const now = new Date();
        return {
          ...exam.toObject(),
          isAttempted: attemptedExamIds.includes(exam._id.toString()),
          isAvailable: now >= exam.startTime && now <= exam.endTime,
          isUpcoming: now < exam.startTime,
          isExpired: now > exam.endTime
        };
      });
      return res.json(examsWithStatus);
    }

    res.json(exams);
  } catch (err) {
    console.error('GET / error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/exams - Create exam and generate questions
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      title, domain, description, totalQuestions, difficulty,
      startTime, endTime, duration, batches,
      marksPerQuestion, negativeMarking
    } = req.body;

    if (!title || !domain || !totalQuestions || !difficulty || !startTime || !endTime || !duration) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const exam = await Exam.create({
      title, domain, description, totalQuestions, difficulty,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      batches: batches || [],
      marksPerQuestion: marksPerQuestion || 1,
      negativeMarking: negativeMarking || 0,
      createdBy: req.user._id,
      status: 'scheduled',
      generationStatus: 'generating'
    });

    if (batches && batches.length > 0) {
      await Batch.updateMany(
        { _id: { $in: batches } },
        { $addToSet: { exams: { exam: exam._id, startTime, endTime, duration } } }
      );
    }

    // Respond immediately, then generate questions in background
    res.status(201).json({ exam, message: 'Exam created. Generating questions with AI...' });

    // Background question generation — fully wrapped to prevent crashes
    setImmediate(async () => {
      try {
        const aiQuestions = await generateQuestions({
          title, domain, description, difficulty, count: totalQuestions
        });

        const questionDocs = [];
        for (let i = 0; i < aiQuestions.length; i++) {
          const q = aiQuestions[i];
          try {
            const doc = await Question.create({
              exam: exam._id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              difficulty: q.difficulty || difficulty,
              topic: q.topic || '',
              explanation: q.explanation || '',
              questionNumber: q.questionNumber || (i + 1)
            });
            questionDocs.push(doc);
          } catch (qErr) {
            console.error(`Failed to save question ${i + 1}:`, qErr.message);
          }
        }

        if (questionDocs.length > 0) {
          await Exam.findByIdAndUpdate(exam._id, {
            questions: questionDocs.map(q => q._id),
            generationStatus: 'completed',
            status: 'scheduled'
          });
          console.log(`✅ Generated ${questionDocs.length} questions for exam: ${title}`);
        } else {
          await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'failed' });
          console.error('❌ No questions were saved for exam:', title);
        }
      } catch (err) {
        console.error('❌ Background question generation failed:', err.message);
        try {
          await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'failed' });
        } catch (updateErr) {
          console.error('❌ Could not update exam status to failed:', updateErr.message);
        }
      }
    });

  } catch (err) {
    console.error('POST / error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/exams/:id/retry - Retry AI question generation
router.post('/:id/retry', protect, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    await Question.deleteMany({ exam: exam._id });
    await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'generating', questions: [] });

    res.json({ message: 'Retrying question generation...' });

    setImmediate(async () => {
      try {
        const aiQuestions = await generateQuestions({
          title: exam.title,
          domain: exam.domain,
          description: exam.description,
          difficulty: exam.difficulty,
          count: exam.totalQuestions
        });

        const questionDocs = [];
        for (let i = 0; i < aiQuestions.length; i++) {
          const q = aiQuestions[i];
          try {
            const doc = await Question.create({
              exam: exam._id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              difficulty: q.difficulty || exam.difficulty,
              topic: q.topic || '',
              explanation: q.explanation || '',
              questionNumber: q.questionNumber || (i + 1)
            });
            questionDocs.push(doc);
          } catch (qErr) {
            console.error(`Retry: Failed to save question ${i + 1}:`, qErr.message);
          }
        }

        if (questionDocs.length > 0) {
          await Exam.findByIdAndUpdate(exam._id, {
            questions: questionDocs.map(q => q._id),
            generationStatus: 'completed'
          });
          console.log(`✅ Retry success: ${questionDocs.length} questions for: ${exam.title}`);
        } else {
          await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'failed' });
        }
      } catch (err) {
        console.error('❌ Retry failed:', err.message);
        try {
          await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'failed' });
        } catch (updateErr) {
          console.error('❌ Could not update retry status:', updateErr.message);
        }
      }
    });

  } catch (err) {
    console.error('POST /:id/retry error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/exams/:id - Get exam details
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('batches', 'name');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/exams/:id/questions - Get questions for exam (during exam only)
router.get('/:id/questions', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (req.user.role === 'student') {
      const now = new Date();
      if (now < exam.startTime) return res.status(403).json({ message: 'Exam has not started yet' });
      if (now > exam.endTime) return res.status(403).json({ message: 'Exam has ended' });

      const existingResult = await Result.findOne({ student: req.user._id, exam: req.params.id });
      if (existingResult) return res.status(403).json({ message: 'You have already submitted this exam' });
    }

    const questions = await Question.find({ exam: req.params.id })
      .select('-correctAnswer -explanation')
      .sort({ questionNumber: 1 });

    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/exams/:id - Update exam
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/exams/:id - Delete exam
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ exam: req.params.id });
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;