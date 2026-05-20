import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Trophy, Layers, TrendingUp, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout title="Dashboard">
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const stats = [
    { label: 'Total Students', value: data?.stats?.totalStudents || 0, icon: Users, color: 'indigo' },
    { label: 'Total Exams', value: data?.stats?.totalExams || 0, icon: BookOpen, color: 'cyan' },
    { label: 'Total Attempts', value: data?.stats?.totalResults || 0, icon: Trophy, color: 'emerald' },
    { label: 'Batches', value: data?.stats?.totalBatches || 0, icon: Layers, color: 'purple' }
  ];

  return (
    <AdminLayout title="Dashboard Overview">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card group hover:scale-105 cursor-default">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${color === 'indigo' ? 'indigo' : color === 'cyan' ? 'cyan' : color === 'emerald' ? 'emerald' : 'purple'}-500/20 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color === 'indigo' ? 'indigo' : color === 'cyan' ? 'cyan' : color === 'emerald' ? 'emerald' : 'purple'}-400`} />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white mb-1">{value.toLocaleString()}</div>
            <div className="text-sm text-gray-400">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Exam Performance Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="card xl:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Exam Performance</h3>
          {data?.examPerformance?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.examPerformance.slice(0, 7)}>
                <XAxis dataKey="title" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => v.length > 12 ? v.slice(0,12)+'…' : v} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(v) => [`${v.toFixed(1)}%`, 'Avg Score']} />
                <Bar dataKey="avgScore" fill="url(#barGradient)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No exam data yet</div>
          )}
        </motion.div>

        {/* Top Students */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> Top Performers
          </h3>
          <div className="space-y-3">
            {data?.topStudents?.length > 0 ? data.topStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-indigo-500/20 text-indigo-400'
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.totalExams} exams</div>
                </div>
                <div className="text-emerald-400 font-bold text-sm">{s.avgScore?.toFixed(1)}%</div>
              </div>
            )) : (
              <div className="text-gray-500 text-sm text-center py-8">No results yet</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Results */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="card">
        <h3 className="text-lg font-bold text-white mb-4">Recent Submissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Student', 'Exam', 'Score', 'Percentage', 'Grade', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentResults?.length > 0 ? data.recentResults.map((r) => (
                <tr key={r._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-white font-medium">{r.student?.name}</td>
                  <td className="py-3 px-3 text-gray-400">{r.exam?.title}</td>
                  <td className="py-3 px-3 text-white">{r.score}/{r.totalMarks}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      r.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                      r.percentage >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{r.percentage?.toFixed(1)}%</span>
                  </td>
                  <td className="py-3 px-3 text-indigo-400 font-bold">{r.grade}</td>
                  <td className="py-3 px-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No submissions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
