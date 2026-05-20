const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AntiCheatLog = require('../models/AntiCheatLog');

// POST /api/anticheat/log - Log a violation
router.post('/log', protect, async (req, res) => {
  try {
    const { examId, violationType } = req.body;

    let log = await AntiCheatLog.findOne({ student: req.user._id, exam: examId });

    if (!log) {
      log = await AntiCheatLog.create({
        student: req.user._id,
        exam: examId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    const existingViolation = log.violations.find(v => v.type === violationType);
    if (existingViolation) {
      existingViolation.count += 1;
      existingViolation.timestamp = new Date();
    } else {
      log.violations.push({ type: violationType, timestamp: new Date(), count: 1 });
    }

    if (violationType === 'tab_switch') {
      log.tabSwitchCount += 1;
    }
    if (violationType === 'fullscreen_exit') {
      log.fullscreenExitCount += 1;
    }

    await log.save();

    const shouldAutoSubmit = log.tabSwitchCount >= 3;
    res.json({ log, shouldAutoSubmit, tabSwitchCount: log.tabSwitchCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/anticheat/status/:examId - Get violation status
router.get('/status/:examId', protect, async (req, res) => {
  try {
    const log = await AntiCheatLog.findOne({ student: req.user._id, exam: req.params.examId });
    res.json({ log, tabSwitchCount: log?.tabSwitchCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
