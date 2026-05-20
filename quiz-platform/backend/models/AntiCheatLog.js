const mongoose = require('mongoose');

const antiCheatLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  violations: [{
    type: { type: String, enum: ['tab_switch', 'fullscreen_exit', 'copy_attempt', 'paste_attempt', 'right_click', 'cut_attempt', 'dev_tools', 'focus_lost'], required: true },
    timestamp: { type: Date, default: Date.now },
    count: { type: Number, default: 1 }
  }],
  tabSwitchCount: { type: Number, default: 0 },
  fullscreenExitCount: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  autoSubmitReason: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, { timestamps: true });

antiCheatLogSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AntiCheatLog', antiCheatLogSchema);
