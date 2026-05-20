import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, Zap, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/results/my'), api.get('/exams')])
      .then(([r, e]) => { setResults(r.data); setExams(e.data); })
      .finally(() => setLoading(false));
  }, []);

  const avgScore = results.length
    ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)
    : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.percentage)).toFixed(1) : 0;
  const pendingExams = exams.filter(e => !e.isAttempted && !e.isExpired).length;

  const radialData = [{ value: Number(avgScore), fill: '#6366f1' }];

  return (
    <StudentLayout title="Dashboard">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}!</span>
            </h2>
            <p className="text-gray-400">{pendingExams > 0 ? `You have ${pendingExams} exam(s) waiting` : 'No pending exams'}</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{user?.xpPoints} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-400 font-bold">Level {user?.level}</span>
              </div>
              {user?.badges?.length > 0 && (
                <div className="flex gap-1">
                  {user.badges.slice(0, 3).map(b => (
                    <span key={b} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {pendingExams > 0 && (
            <Link to="/student/exams" className="btn-primary flex items-center gap-2 whitespace-nowrap">
              Take Exam <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Exams Taken', value: results.length, icon: BookOpen, color: 'indigo' },
          { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'cyan' },
          { label: 'Best Score', value: `${bestScore}%`, icon: Trophy, color: 'emerald' },
          { label: 'XP Earned', value: user?.xpPoints || 0, icon: Zap, color: 'yellow' }
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card hover:scale-105 cursor-default">
            <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`}>
              <Icon className={`w-6 h-6 text-${color}-400`} />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Circle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card text-center">
          <h3 className="text-lg font-bold text-white mb-4">Overall Performance</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#ffffff10' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-3xl font-black gradient-text -mt-12">{avgScore}%</div>
          <div className="text-gray-400 text-sm mt-1">Average Score</div>
        </motion.div>

        {/* Recent Results */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card xl:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Recent Results</h3>
          <div className="space-y-3">
            {results.slice(0, 5).map(r => (
              <Link key={r._id} to={`/student/result/${r._id}`}
                className="flex items-center gap-4 p-3 glass rounded-xl hover:border-indigo-500/20 border border-transparent transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                  ${r.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' : r.percentage >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {r.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{r.exam?.title}</div>
                  <div className="text-xs text-gray-500">{r.exam?.domain} • {new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold ${r.percentage >= 80 ? 'text-emerald-400' : r.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {r.percentage?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">{r.score}/{r.totalMarks}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </Link>
            ))}
            {results.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No exams taken yet. Start your first exam!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
