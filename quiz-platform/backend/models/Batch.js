const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  exams: [{
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

batchSchema.virtual('studentCount').get(function () {
  return this.students.length;
});

module.exports = mongoose.model('Batch', batchSchema);
