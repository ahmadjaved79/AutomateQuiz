import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, UserCheck } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/students'), api.get('/batches')])
      .then(([s, b]) => { setStudents(s.data); setBatches(b.data); })
      .finally(() => setLoading(false));
  }, []);

  const assignBatch = async (studentId, batchId) => {
    try {
      await api.put(`/admin/students/${studentId}/batch`, { batchId: batchId || null });
      toast.success('Batch updated');
      setStudents(prev => prev.map(s => {
        if (s._id !== studentId) return s;
        const batch = batches.find(b => b._id === batchId);
        return { ...s, batch: batch ? { _id: batchId, name: batch.name } : null };
      }));
    } catch { toast.error('Failed to update batch'); }
  };

  const deleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;
    await api.delete(`/admin/students/${id}`);
    toast.success('Student deleted');
    setStudents(s => s.filter(st => st._id !== id));
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Student Management">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input-field pl-11" placeholder="Search students..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-gray-400 text-sm">{filtered.length} students</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Student', 'Email', 'Batch', 'XP/Level', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-300 font-bold text-sm">
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{s.email}</td>
                  <td className="py-3 px-4">
                    <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-300 text-xs focus:outline-none focus:border-indigo-500"
                      value={s.batch?._id || ''} onChange={e => assignBatch(s._id, e.target.value)}>
                      <option value="">Unassigned</option>
                      {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-indigo-400 font-medium">{s.xpPoints} XP</span>
                    <span className="text-gray-500 ml-2 text-xs">Lv.{s.level}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => deleteStudent(s._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">No students found</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
