import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Download } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';

export default function AdminResults() {
  const { examId } = useParams();
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/results/exam/${examId}`), api.get(`/exams/${examId}`)])
      .then(([r, e]) => { setResults(r.data); setExam(e.data); })
      .finally(() => setLoading(false));
  }, [examId]);

  const gradeColor = (g) => ({ 'A+': 'text-emerald-400', A: 'text-emerald-400', 'B+': 'text-cyan-400', B: 'text-cyan-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400' }[g] || 'text-gray-400');

  return (
    <AdminLayout title={`Results: ${exam?.title || 'Loading...'}`}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Attempts', value: results.length },
              { label: 'Avg Score', value: results.length ? `${(results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)}%` : '—' },
              { label: 'Highest', value: results.length ? `${Math.max(...results.map(r => r.percentage)).toFixed(1)}%` : '—' },
              { label: 'Lowest', value: results.length ? `${Math.min(...results.map(r => r.percentage)).toFixed(1)}%` : '—' }
            ].map(({ label, value }) => (
              <div key={label} className="card text-center">
                <div className="text-2xl font-black gradient-text">{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Rankings
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Rank', 'Student', 'Batch', 'Score', 'Percentage', 'Grade', 'Correct', 'Wrong', 'Time', 'Submitted'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-indigo-500/20 text-indigo-400'
                      }`}>{r.rank}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-white">{r.student?.name}</td>
                    <td className="py-3 px-3 text-gray-400">{r.batch?.name || '—'}</td>
                    <td className="py-3 px-3 text-white">{r.score}/{r.totalMarks}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.percentage}%` }} />
                        </div>
                        <span className={r.percentage >= 80 ? 'text-emerald-400' : r.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                          {r.percentage?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 px-3 font-black ${gradeColor(r.grade)}`}>{r.grade}</td>
                    <td className="py-3 px-3 text-emerald-400">{r.correctAnswers}</td>
                    <td className="py-3 px-3 text-red-400">{r.wrongAnswers}</td>
                    <td className="py-3 px-3 text-gray-400">{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{new Date(r.submittedAt).toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && (
              <div className="text-center py-12 text-gray-500">No submissions yet</div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
