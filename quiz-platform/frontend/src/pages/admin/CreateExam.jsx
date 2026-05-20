import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Clock, Calendar, Layers } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function CreateExam() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', domain: '', description: '', totalQuestions: 20,
    difficulty: 'Medium', startTime: '', endTime: '', duration: 60,
    batches: [], marksPerQuestion: 1, negativeMarking: 0
  });

  useEffect(() => {
    api.get('/batches').then(r => setBatches(r.data)).catch(() => {});
  }, []);

  const toggleBatch = (id) => {
    setForm(f => ({
      ...f,
      batches: f.batches.includes(id) ? f.batches.filter(b => b !== id) : [...f.batches, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.domain || !form.startTime || !form.endTime) {
      return toast.error('Please fill all required fields');
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error('End time must be after start time');
    }
    setLoading(true);
    try {
      await api.post('/exams', form);
      toast.success('Exam created! AI is generating questions...');
      navigate('/admin/exams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const domains = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'Civil Engineering', 'Mechanical Engineering', 'English', 'General Knowledge'];

  return (
    <AdminLayout title="Create New Exam">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <div className="glass rounded-2xl p-2 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">AI Question Generation</p>
            <p className="text-xs text-gray-400">Questions will be auto-generated using AI after exam creation</p>
          </div>
          <Sparkles className="w-5 h-5 text-indigo-400 ml-auto" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Exam Title *</label>
                <input className="input-field" placeholder="e.g., ECET Mathematics Mock Test 1"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Domain/Subject *</label>
                <select className="input-field" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} required>
                  <option value="">Select Domain</option>
                  {domains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Difficulty Level</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                        form.difficulty === d ? 'bg-indigo-500 text-white' : 'glass text-gray-400 hover:text-white'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Description (Optional)</label>
                <textarea className="input-field h-20 resize-none" placeholder="Describe exam topics, focus areas..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Schedule & Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Start Time *</label>
                <input type="datetime-local" className="input-field"
                  value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">End Time *</label>
                <input type="datetime-local" className="input-field"
                  value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Duration (minutes)</label>
                <input type="number" className="input-field" min={10} max={300}
                  value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Number of Questions</label>
                <input type="number" className="input-field" min={5} max={100}
                  value={form.totalQuestions} onChange={e => setForm({ ...form, totalQuestions: +e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Marks per Question</label>
                <input type="number" className="input-field" min={1} max={10}
                  value={form.marksPerQuestion} onChange={e => setForm({ ...form, marksPerQuestion: +e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Negative Marking</label>
                <input type="number" className="input-field" min={0} max={5} step={0.25}
                  value={form.negativeMarking} onChange={e => setForm({ ...form, negativeMarking: +e.target.value })} />
              </div>
            </div>
          </div>

          {batches.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layers className="w-5 h-5" /> Assign to Batches</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {batches.map(b => (
                  <button key={b._id} type="button" onClick={() => toggleBatch(b._id)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                      form.batches.includes(b._id) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'glass border-white/10 text-gray-400 hover:border-white/20'
                    }`}>
                    <div className="font-bold">{b.name}</div>
                    <div className="text-xs opacity-70">{b.students?.length || 0} students</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating & Generating...
                </>
              ) : (
                <><Sparkles className="w-4 h-4" /> Create Exam with AI</>
              )}
            </button>
            <button type="button" onClick={() => navigate('/admin/exams')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </motion.div>
    </AdminLayout>
  );
}
