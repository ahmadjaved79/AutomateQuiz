import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../utils/api';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results/my').then(r => setResults(r.data)).finally(() => setLoading(false));
  }, []);

  const chartData = results.slice().reverse().map((r, i) => ({
    name: `#${i + 1}`,
    score: r.percentage,
    exam: r.exam?.title
  }));

  const gradeColor = g => ({ 'A+': 'text-emerald-400', A: 'text-emerald-400', 'B+': 'text-cyan-400', B: 'text-cyan-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400' }[g] || 'text-gray-400');
  const gradeBg = g => ({ 'A+': 'bg-emerald-500/20', A: 'bg-emerald-500/20', 'B+': 'bg-cyan-500/20', B: 'bg-cyan-500/20', C: 'bg-yellow-500/20', D: 'bg-orange-500/20', F: 'bg-red-500/20' }[g] || 'bg-gray-500/20');

  return (
    <StudentLayout title="My Results">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Results Yet</h3>
          <p className="text-gray-400 mb-6">Complete your first exam to see results here</p>
          <Link to="/student/exams" className="btn-primary inline-flex">Go to Exams</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Chart */}
          {results.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" /> Progress Over Time
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, color: '#e2e8f0' }}
                    formatter={(v, n, p) => [`${v.toFixed(1)}%`, p.payload.exam || 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#1e1b4b' }}
                    activeDot={{ r: 7, fill: '#818cf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Results List */}
          <div className="grid gap-4">
            {results.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/student/result/${r._id}`}
                  className="card flex items-center gap-4 hover:border-indigo-500/30 group cursor-pointer transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${gradeBg(r.grade)} ${gradeColor(r.grade)}`}>
                    {r.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{r.exam?.title}</div>
                    <div className="text-sm text-gray-500">{r.exam?.domain} • {new Date(r.submittedAt || r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-black ${gradeColor(r.grade)}`}>{r.percentage?.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">{r.score}/{r.totalMarks} marks</div>
                  </div>
                  <div className="text-right flex-shrink-0 text-xs text-gray-600">
                    <div className="text-emerald-400">{r.correctAnswers} ✓</div>
                    <div className="text-red-400">{r.wrongAnswers} ✗</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
