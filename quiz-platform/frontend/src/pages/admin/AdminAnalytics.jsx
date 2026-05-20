import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout title="Analytics">
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const scoreDistData = data?.scoreDistribution?.map(d => ({
    range: `${d._id}-${d._id + 20}%`,
    count: d.count
  })) || [];

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = data?.monthlyAttempts?.map(d => ({
    month: monthNames[d._id.month],
    attempts: d.count,
    avgScore: Math.round(d.avgScore * 10) / 10
  })) || [];

  const tooltipStyle = { background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, color: '#e2e8f0' };

  return (
    <AdminLayout title="Analytics & Insights">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Batch Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-lg font-bold text-white mb-6">Batch Performance Comparison</h3>
          {data?.batchPerformance?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.batchPerformance}>
                <XAxis dataKey="batchName" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v.toFixed(1)}%`, 'Avg Score']} />
                <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                  {data.batchPerformance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No batch data yet</div>
          )}
        </motion.div>

        {/* Score Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="text-lg font-bold text-white mb-6">Score Distribution</h3>
          {scoreDistData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={280}>
                <PieChart>
                  <Pie data={scoreDistData} dataKey="count" cx="50%" cy="50%" outerRadius={100} innerRadius={50}>
                    {scoreDistData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {scoreDistData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-400">{d.range}</span>
                    <span className="text-white font-medium ml-auto">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data yet</div>
          )}
        </motion.div>

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card xl:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Monthly Activity Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Line yAxisId="left" type="monotone" dataKey="attempts" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Attempts" />
                <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} name="Avg Score %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No monthly data yet</div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
