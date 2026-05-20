const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  domain: { type: String, required: true },
  description: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  totalQuestions: { type: Number, required: true, min: 1, max: 100 },
  duration: { type: Number, required: true }, // in minutes
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  marksPerQuestion: { type: Number, default: 1 },
  negativeMarking: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'scheduled', 'active', 'completed'], default: 'scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  aiModel: { type: String, default: 'meta-llama/llama-3.2-3b-instruct:free' },
  generationStatus: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true });

examSchema.virtual('totalMarks').get(function () {
  return this.totalQuestions * this.marksPerQuestion;
});

examSchema.methods.isCurrentlyActive = function () {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime && this.isActive;
};

module.exports = mongoose.model('Exam', examSchema);
