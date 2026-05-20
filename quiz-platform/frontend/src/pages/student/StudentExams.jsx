import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Lock, Play, Calendar, Layers } from 'lucide-react';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../utils/api';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams').then(r => setExams(r.data)).finally(() => setLoading(false));
  }, []);

  const getStatusInfo = (exam) => {
    if (exam.isAttempted) return { label: 'Completed', color: 'emerald', icon: CheckCircle, canStart: false };
    if (exam.isExpired) return { label: 'Expired', color: 'gray', icon: Lock, canStart: false };
    if (exam.isUpcoming) return { label: 'Upcoming', color: 'blue', icon: Calendar, canStart: false };
    if (exam.isAvailable) return { label: 'Available Now', color: 'indigo', icon: Play, canStart: true };
    return { label: 'Unavailable', color: 'gray', icon: Lock, canStart: false };
  };

  const diffColor = { Easy: 'text-emerald-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };

  return (
    <StudentLayout title="My Exams">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-white mb-2">No Exams Assigned</h3>
          <p className="text-gray-400">Contact your administrator to get assigned to a batch</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam, i) => {
            const status = getStatusInfo(exam);
            const StatusIcon = status.icon;
            return (
              <motion.div key={exam._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`card hover:border-${status.color}-500/20 transition-all`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${status.color}-500/20 text-${status.color}-400 font-medium`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">{exam.domain}</span>
                      <span className={diffColor[exam.difficulty]}>{exam.difficulty}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration} min</span>
                      <span>{exam.totalQuestions} Questions</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      <span className="flex items-center gap-1 inline-flex">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.startTime).toLocaleString()} — {new Date(exam.endTime).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {status.canStart && exam.generationStatus === 'completed' ? (
                      <Link to={`/student/exam/${exam._id}`}
                        className="btn-primary flex items-center gap-2">
                        <Play className="w-4 h-4" /> Start Exam
                      </Link>
                    ) : exam.isAttempted ? (
                      <span className="flex items-center gap-2 text-emerald-400 font-medium">
                        <CheckCircle className="w-5 h-5" /> Submitted
                      </span>
                    ) : status.canStart && exam.generationStatus !== 'completed' ? (
                      <span className="text-yellow-400 text-sm">Questions generating...</span>
                    ) : (
                      <button disabled className="btn-secondary opacity-50 cursor-not-allowed flex items-center gap-2">
                        <Lock className="w-4 h-4" /> {status.label}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
