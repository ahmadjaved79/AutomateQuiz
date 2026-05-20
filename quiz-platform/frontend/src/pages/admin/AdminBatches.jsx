import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, UserMinus, Users } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [b, s] = await Promise.all([api.get('/batches'), api.get('/admin/students')]);
      setBatches(b.data);
      setStudents(s.data.filter(s => !s.batch));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/batches', form);
      toast.success('Batch created!');
      setForm({ name: '', description: '' });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteBatch = async (id) => {
    if (!confirm('Delete this batch?')) return;
    await api.delete(`/batches/${id}`);
    toast.success('Batch deleted');
    fetchData();
  };

  const removeStudent = async (batchId, studentId) => {
    await api.delete(`/batches/${batchId}/students/${studentId}`);
    toast.success('Student removed');
    fetchData();
  };

  const addStudent = async (batchId, studentId) => {
    await api.post(`/batches/${batchId}/students`, { studentId });
    toast.success('Student added to batch');
    fetchData();
  };

  return (
    <AdminLayout title="Batch Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">{batches.length} batches</p>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Batch
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Batch</h3>
          <form onSubmit={createBatch} className="flex gap-4 flex-wrap">
            <input className="input-field flex-1 min-w-48" placeholder="Batch name (e.g., Batch A)"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input-field flex-1 min-w-48" placeholder="Description (optional)"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {batches.map((batch, i) => (
            <motion.div key={batch._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{batch.name}</h3>
                  {batch.description && <p className="text-gray-400 text-sm">{batch.description}</p>}
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{batch.students?.length || 0} students</span>
                  </div>
                </div>
                <button onClick={() => deleteBatch(batch._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Add unassigned students */}
              {students.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-2 block">Add student to this batch:</label>
                  <div className="flex flex-wrap gap-2">
                    {students.slice(0, 10).map(s => (
                      <button key={s._id} onClick={() => addStudent(batch._id, s._id)}
                        className="text-xs px-3 py-1 glass rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                        + {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Students in batch */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {batch.students?.length > 0 ? batch.students.map(s => (
                  <div key={s._id} className="flex items-center justify-between glass rounded-xl p-3">
                    <div>
                      <div className="text-sm font-medium text-white">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                    <button onClick={() => removeStudent(batch._id, s._id)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors">
                      <UserMinus className="w-3 h-3" />
                    </button>
                  </div>
                )) : (
                  <div className="col-span-3 text-gray-500 text-sm py-4 text-center">No students assigned</div>
                )}
              </div>
            </motion.div>
          ))}

          {batches.length === 0 && (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-white mb-2">No Batches Yet</h3>
              <p className="text-gray-400">Create batches to organize your students</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
