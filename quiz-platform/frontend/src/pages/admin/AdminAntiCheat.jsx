import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';

export default function AdminAntiCheat() {
  const { examId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/anticheat/${examId}`).then(r => { setLogs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [examId]);

  const violationColor = (type) => ({
    tab_switch: 'text-yellow-400 bg-yellow-500/10',
    fullscreen_exit: 'text-orange-400 bg-orange-500/10',
    copy_attempt: 'text-red-400 bg-red-500/10',
    paste_attempt: 'text-red-400 bg-red-500/10',
    right_click: 'text-gray-400 bg-gray-500/10',
  }[type] || 'text-gray-400 bg-gray-500/10');

  return (
    <AdminLayout title="Anti-Cheat Monitoring">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="card text-center py-16">
              <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">No Violations Detected</h3>
              <p className="text-gray-400 mt-2">All students followed exam rules</p>
            </div>
          ) : logs.map((log, i) => (
            <motion.div key={log._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`card ${log.autoSubmitted ? 'border border-red-500/30' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white">{log.student?.name}</h3>
                    {log.autoSubmitted && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">AUTO-SUBMITTED</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{log.student?.email}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{log.tabSwitchCount} tab switches</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{log.violations?.length || 0} total violations</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {log.violations?.map((v, vi) => (
                  <span key={vi} className={`px-3 py-1 rounded-lg text-xs font-medium ${violationColor(v.type)}`}>
                    {v.type.replace(/_/g, ' ')} × {v.count}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
