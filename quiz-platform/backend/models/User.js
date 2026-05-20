const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  xpPoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  badges: [{ type: String }],
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: '' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.updateXP = function (points) {
  this.xpPoints += points;
  this.level = Math.floor(this.xpPoints / 100) + 1;
};

module.exports = mongoose.model('User', userSchema);
