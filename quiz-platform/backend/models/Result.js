const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
    isCorrect: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 }
  }],
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  unattempted: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 }, // in seconds
  rank: { type: Number, default: null },
  grade: { type: String, default: '' },
  xpEarned: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  isAutoSubmitted: { type: Boolean, default: false },
  aiFeedback: {
    strengths: [String],
    weakAreas: [String],
    suggestions: [String],
    summary: { type: String, default: '' }
  },
  startedAt: { type: Date }
}, { timestamps: true });

resultSchema.index({ exam: 1, student: 1 }, { unique: true });

resultSchema.methods.calculateGrade = function () {
  const p = this.percentage;
  if (p >= 90) return 'A+';
  if (p >= 80) return 'A';
  if (p >= 70) return 'B+';
  if (p >= 60) return 'B';
  if (p >= 50) return 'C';
  if (p >= 40) return 'D';
  return 'F';
};

module.exports = mongoose.model('Result', resultSchema);
