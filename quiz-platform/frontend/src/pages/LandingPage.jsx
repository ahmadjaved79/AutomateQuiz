import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Shield, Trophy, Zap, BarChart3, Users, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

export default function LandingPage() {
  return (
    <div className="min-h-screen mesh-bg font-poppins overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QuizMaster AI</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ y: [0, -30, 0], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <motion.div animate={{ y: [0, 30, 0], rotate: [360, 180, 0] }} transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass border border-indigo-500/30 px-4 py-2 rounded-full text-sm text-indigo-300 mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Exam Platform for ECET/EAMCET Preparation
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="text-white">Master Your</span>
            <br />
            <span className="gradient-text">Exam Journey</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            AI-generated quizzes, real-time analytics, gamified learning, and enterprise-grade anti-cheating — all in one platform built for serious exam preparation.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center gap-2 justify-center text-lg">
              Start Free Today <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg">
              Admin Login
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
            {[['10K+', 'Students'], ['500+', 'Exams Created'], ['98%', 'Success Rate']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black gradient-text">{val}</div>
                <div className="text-gray-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
              <h2 className="text-5xl font-black text-white mb-4">Everything You Need</h2>
              <p className="text-gray-400 text-xl">A complete ecosystem for modern exam management</p>
            </motion.div>
          </div>

          <motion.div initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, color: 'indigo', title: 'AI Question Generation', desc: 'Automatically generate balanced MCQ questions using advanced AI based on topic, difficulty and domain.' },
              { icon: Shield, color: 'emerald', title: 'Anti-Cheat Engine', desc: 'Tab-switch detection, fullscreen enforcement, copy/paste blocking, and auto-submission on violations.' },
              { icon: Trophy, color: 'yellow', title: 'Gamified Experience', desc: 'XP points, achievement badges, level progression, streaks, and confetti animations for motivation.' },
              { icon: BarChart3, color: 'cyan', title: 'Advanced Analytics', desc: 'Interactive charts, batch rankings, performance heatmaps, and AI-generated improvement suggestions.' },
              { icon: Users, color: 'purple', title: 'Batch Management', desc: 'Create student batches, assign different exam schedules, and track progress by group.' },
              { icon: Zap, color: 'orange', title: 'Real-Time Monitoring', desc: 'Live exam tracking, anti-cheat logs, student activity monitoring, and instant result processing.' }
            ].map(({ icon: Icon, color, title, desc }) => (
              <motion.div key={title} variants={fadeUp}
                className="card group hover:scale-105 cursor-default">
                <div className={`w-14 h-14 rounded-2xl bg-${color === 'yellow' ? 'yellow' : color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 text-${color === 'yellow' ? 'yellow' : color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Three simple steps to exam excellence</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Admin Creates Exam', desc: 'Set title, domain, difficulty & schedule. AI auto-generates questions instantly.' },
              { step: '02', title: 'Students Attempt', desc: 'Secure exam environment with timer, palette, and anti-cheat protection active.' },
              { step: '03', title: 'Instant AI Analysis', desc: 'Results, rankings, and personalized AI feedback generated automatically.' }
            ].map(({ step, title, desc }) => (
              <motion.div key={step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="relative card text-center group">
                <div className="text-7xl font-black text-white/5 absolute top-4 right-4 font-nunito">{step}</div>
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black gradient-text">{step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Anti-Cheat Showcase */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-3xl" />
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full text-red-400 text-sm mb-6">
                  <Shield className="w-4 h-4" /> Enterprise Anti-Cheat
                </div>
                <h2 className="text-4xl font-black text-white mb-6">Zero Tolerance for Cheating</h2>
                <div className="space-y-4">
                  {['Tab-switch detection (auto-submit after 3)', 'Full-screen enforcement', 'Copy/Paste/Right-click disabled', 'Multiple submission prevention', 'Real-time violation logging', 'Detailed admin audit trail'].map(f => (
                    <div key={f} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-strong rounded-2xl p-6">
                <div className="text-sm text-red-400 font-mono mb-4">// ANTI-CHEAT SYSTEM ACTIVE</div>
                {[
                  { event: 'Tab Switch Detected', time: '14:23:01', status: 'WARNING' },
                  { event: 'Fullscreen Exit', time: '14:23:45', status: 'WARNING' },
                  { event: 'Tab Switch #2', time: '14:24:12', status: 'WARNING' },
                  { event: 'Copy Attempt', time: '14:24:30', status: 'BLOCKED' },
                  { event: 'Auto Submitted', time: '14:24:55', status: 'ACTION' },
                ].map(({ event, time, status }) => (
                  <div key={event} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-300">{event}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono">{time}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                        status === 'BLOCKED' ? 'bg-red-500/20 text-red-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-5xl font-black text-white mb-6">Ready to Transform Your Exam Prep?</h2>
            <p className="text-gray-400 text-lg mb-10">Join thousands of students mastering ECET/EAMCET with AI-powered precision.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary flex items-center gap-2 justify-center text-lg">
                Start Free <Sparkles className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary text-lg">Admin Portal</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-gray-400">QuizMaster AI</span>
        </div>
        <p>© 2024 QuizMaster AI. Built for exam excellence.</p>
      </footer>
    </div>
  );
}