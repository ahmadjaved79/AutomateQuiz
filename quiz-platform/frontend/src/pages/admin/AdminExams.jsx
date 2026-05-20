import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, BarChart3, Shield, CheckCircle, Clock, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const genConfig = {
  generating: { label: 'Generating...', color: 'yellow',  icon: Loader },
  completed:  { label: 'Ready',         color: 'emerald', icon: CheckCircle },
  failed:     { label: 'Failed',        color: 'red',     icon: AlertCircle },
  pending:    { label: 'Pending',       color: 'gray',    icon: Clock }
};

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState({});

  const fetchExams = () => {
    api.get('/exams/admin/all')
      .then(r => { setExams(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
    // Poll every 8 seconds to update generation status
    const interval = setInterval(fetchExams, 8000);
    return () => clearInterval(interval);
  }, []);

  const deleteExam = async (id) => {
    if (!confirm('Delete this exam and all its questions?')) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      setExams(e => e.filter(ex => ex._id !== id));
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const retryGeneration = async (id) => {
    setRetrying(r => ({ ...r, [id]: true }));
    try {
      await api.post(`/exams/${id}/retry`);
      toast.success('Retrying question generation...');
      // Optimistically set to generating
      setExams(prev => prev.map(e => e._id === id ? { ...e, generationStatus: 'generating' } : e));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying(r => ({ ...r, [id]: false }));
    }
  };

  return (
    <AdminLayout title="Manage Exams">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">{exams.length} total exams</p>
        <div className="flex items-center gap-3">
          <button onClick={fetchExams} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/admin/exams/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Exam
          </Link>
        </div>
      </div>

      {/* API Key warning if no key set */}
      <div className="mb-4 p-4 glass rounded-xl border border-yellow-500/20 text-sm text-yellow-400 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">If exams show "Failed":</span> Check your <code className="bg-white/10 px-1 rounded">OPENROUTER_API_KEY</code> in <code className="bg-white/10 px-1 rounded">backend/.env</code>.
          Get a free key at <a href="https://openrouter.ai" target="_blank" className="underline">openrouter.ai</a>.
          Without a key, fallback template questions will be used automatically.
          Click <span className="font-bold">Retry</span> on any failed exam.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-white mb-2">No Exams Yet</h3>
          <p className="text-gray-400 mb-6">Create your first AI-powered exam</p>
          <Link to="/admin/exams/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Exam
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam, i) => {
            const gen = genConfig[exam.generationStatus] || genConfig.pending;
            const GenIcon = gen.icon;
            const isRetrying = retrying[exam._id];

            return (
              <motion.div key={exam._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`card hover:border-indigo-500/20 ${exam.generationStatus === 'failed' ? 'border border-red-500/20' : ''}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    {/* Title + status badge */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-${gen.color}-500/20 text-${gen.color}-400`}>
                        <GenIcon className={`w-3 h-3 ${exam.generationStatus === 'generating' ? 'animate-spin' : ''}`} />
                        {gen.label}
                      </span>
                      {exam.generationStatus === 'completed' && (
                        <span className="text-xs text-gray-500">{exam.questions?.length || exam.totalQuestions} questions ready</span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">{exam.domain}</span>
                      <span>{exam.totalQuestions} Questions</span>
                      <span className={exam.difficulty === 'Easy' ? 'text-emerald-400' : exam.difficulty === 'Hard' ? 'text-red-400' : 'text-yellow-400'}>
                        {exam.difficulty}
                      </span>
                      <span>{exam.duration} min</span>
                      {exam.batches?.length > 0 && (
                        <span className="text-gray-500">Batches: {exam.batches.map(b => b.name).join(', ')}</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(exam.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} → {new Date(exam.endTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {exam.generationStatus === 'failed' && (
                      <button
                        onClick={() => retryGeneration(exam._id)}
                        disabled={isRetrying}
                        className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                    {exam.generationStatus === 'generating' && (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <Loader className="w-3 h-3 animate-spin" /> Generating...
                      </span>
                    )}
                    <Link to={`/admin/results/${exam._id}`}
                      className="p-2 glass rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors" title="View Results">
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <Link to={`/admin/anticheat/${exam._id}`}
                      className="p-2 glass rounded-lg text-orange-400 hover:bg-orange-500/10 transition-colors" title="Anti-Cheat Logs">
                      <Shield className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteExam(exam._id)}
                      className="p-2 glass rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}