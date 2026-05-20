const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Batch = require('../models/Batch');
const AntiCheatLog = require('../models/AntiCheatLog');
const Question = require('../models/Question');

// All routes require admin
router.use(protect, adminOnly);

// GET /api/admin/dashboard - Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [totalStudents, totalExams, totalResults, totalBatches] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Exam.countDocuments(),
      Result.countDocuments(),
      Batch.countDocuments()
    ]);

    const recentResults = await Result.find()
      .populate('student', 'name email')
      .populate('exam', 'title domain')
      .sort({ createdAt: -1 })
      .limit(10);

    const topStudents = await Result.aggregate([
      { $group: { _id: '$student', avgScore: { $avg: '$percentage' }, totalExams: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { name: '$student.name', email: '$student.email', avgScore: 1, totalExams: 1 } }
    ]);

    const examPerformance = await Result.aggregate([
      { $group: { _id: '$exam', avgScore: { $avg: '$percentage' }, attempts: { $sum: 1 } } },
      { $lookup: { from: 'exams', localField: '_id', foreignField: '_id', as: 'exam' } },
      { $unwind: '$exam' },
      { $project: { title: '$exam.title', domain: '$exam.domain', avgScore: 1, attempts: 1 } },
      { $sort: { avgScore: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      stats: { totalStudents, totalExams, totalResults, totalBatches },
      recentResults,
      topStudents,
      examPerformance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students - All students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('batch', 'name')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/students/:id/batch - Assign student to batch
router.put('/students/:id/batch', async (req, res) => {
  try {
    const { batchId } = req.body;
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { batch: batchId || null },
      { new: true }
    ).select('-password').populate('batch', 'name');

    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: req.params.id } });
      // Remove from other batches
      await Batch.updateMany(
        { _id: { $ne: batchId }, students: req.params.id },
        { $pull: { students: req.params.id } }
      );
    } else {
      await Batch.updateMany({ students: req.params.id }, { $pull: { students: req.params.id } });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/rankings - Exam rankings
router.get('/rankings/:examId', async (req, res) => {
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

// GET /api/admin/anticheat/:examId - Anti-cheat logs
router.get('/anticheat/:examId', async (req, res) => {
  try {
    const logs = await AntiCheatLog.find({ exam: req.params.examId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/analytics - Full analytics
router.get('/analytics', async (req, res) => {
  try {
    const batchPerformance = await Result.aggregate([
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentData' } },
      { $unwind: '$studentData' },
      { $match: { 'studentData.batch': { $ne: null } } },
      { $group: { _id: '$studentData.batch', avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 } } },
      { $lookup: { from: 'batches', localField: '_id', foreignField: '_id', as: 'batchData' } },
      { $unwind: '$batchData' },
      { $project: { batchName: '$batchData.name', avgScore: 1, totalAttempts: 1 } }
    ]);

    const scoreDistribution = await Result.aggregate([
      {
        $bucket: {
          groupBy: '$percentage',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: '100',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const monthlyAttempts = await Result.aggregate([
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$percentage' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({ batchPerformance, scoreDistribution, monthlyAttempts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/students/:id - Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Batch.updateMany({ students: req.params.id }, { $pull: { students: req.params.id } });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
