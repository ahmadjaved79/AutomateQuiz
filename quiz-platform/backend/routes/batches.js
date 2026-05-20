const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Batch = require('../models/Batch');
const User = require('../models/User');

// GET /api/batches - Get all batches
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('students', 'name email xpPoints level')
      .populate('exams.exam', 'title domain startTime endTime')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/batches - Create batch
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Batch name is required' });

    const existing = await Batch.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Batch with this name already exists' });

    const batch = await Batch.create({ name, description });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/batches/:id - Update batch
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/batches/:id - Delete batch
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Batch.findByIdAndDelete(req.params.id);
    await User.updateMany({ batch: req.params.id }, { batch: null });
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/batches/:id/students - Add student to batch
router.post('/:id/students', protect, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { students: studentId } },
      { new: true }
    ).populate('students', 'name email');

    await User.findByIdAndUpdate(studentId, { batch: req.params.id });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/batches/:id/students/:studentId - Remove student
router.delete('/:id/students/:studentId', protect, adminOnly, async (req, res) => {
  try {
    await Batch.findByIdAndUpdate(req.params.id, { $pull: { students: req.params.studentId } });
    await User.findByIdAndUpdate(req.params.studentId, { batch: null });
    res.json({ message: 'Student removed from batch' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
