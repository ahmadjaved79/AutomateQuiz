import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Trophy, BookOpen, TrendingUp } from 'lucide-react';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function StudentProfile() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get('/results/my').then(r => setResults(r.data)).catch(() => {});
  }, []);

  const avgScore = results.length ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1) : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.percentage)).toFixed(1) : 0;
  const levelProgress = user ? user.xpPoints % 100 : 0;

  const badgeEmojis = { 'High Achiever': '🏆', 'Perfect Score': '💯', 'Fast Finisher': '⚡', 'Consistent': '🔥' };

  return (
    <StudentLayout title="My Profile">
      <div className="max-w-3xl space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-medium">
                  {user?.batch?.name || 'No Batch'}
                </span>
                <span className="text-xs text-gray-500">Student</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* XP & Level */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Level Progress</h3>
            <span className="text-2xl font-black gradient-text">Level {user?.level}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div className="h-full progress-bar rounded-full"
              initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{user?.xpPoints} XP total</span>
            <span>{levelProgress}/100 to Level {(user?.level || 1) + 1}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Exams Taken', value: results.length, icon: BookOpen, color: 'indigo' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'cyan' },
            { label: 'Best Score', value: `${bestScore}%`, icon: Trophy, color: 'emerald' },
            { label: 'XP Points', value: user?.xpPoints || 0, icon: Zap, color: 'yellow' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon className={`w-5 h-5 text-${color}-400 mx-auto mb-2`} />
              <div className={`text-xl font-black text-${color}-400`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> Achievements
          </h3>
          {user?.badges?.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {user.badges.map(badge => (
                <div key={badge} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
                  <span className="text-xl">{badgeEmojis[badge] || '🏅'}</span>
                  <span className="text-yellow-400 font-medium text-sm">{badge}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>Complete exams to earn badges!</p>
              <p className="text-xs mt-1">Score 80%+ to earn "High Achiever", 100% for "Perfect Score"</p>
            </div>
          )}
        </motion.div>
      </div>
    </StudentLayout>
  );
}
