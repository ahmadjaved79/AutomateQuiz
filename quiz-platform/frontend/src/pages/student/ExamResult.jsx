import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, Clock, Brain, ArrowLeft, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../utils/api';

export default function ExamResult() {
  const { resultId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const confettiFired = useRef(false);
  const xpEarned = location.state?.xpEarned || 0;

  useEffect(() => {
    api.get(`/results/${resultId}`).then(r => {
      setResult(r.data);
      setLoading(false);
      // Animate score
      let s = 0;
      const interval = setInterval(() => {
        s += 2;
        if (s >= r.data.percentage) { setScore(r.data.percentage); clearInterval(interval); } else setScore(s);
      }, 20);
      // Confetti for good scores
      if (r.data.percentage >= 60 && !confettiFired.current) {
        confettiFired.current = true;
        setTimeout(() => {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366f1', '#06b6d4', '#10b981'] });
        }, 600);
      }
    }).catch(() => setLoading(false));
  }, [resultId]);

  if (loading) return (
    <StudentLayout title="Results">
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </StudentLayout>
  );
  if (!result) return <StudentLayout title="Results"><div className="text-center text-gray-400 py-16">Result not found</div></StudentLayout>;

  const gradeConfig = {
    'A+': { color: '#10b981', label: 'Outstanding! 🏆', bg: 'from-emerald-500/20 to-cyan-500/20' },
    'A':  { color: '#10b981', label: 'Excellent! 🌟', bg: 'from-emerald-500/20 to-green-500/20' },
    'B+': { color: '#06b6d4', label: 'Great Job! 👏', bg: 'from-cyan-500/20 to-blue-500/20' },
    'B':  { color: '#06b6d4', label: 'Good Work! 👍', bg: 'from-cyan-500/20 to-indigo-500/20' },
    'C':  { color: '#f59e0b', label: 'Keep Going! 💪', bg: 'from-yellow-500/20 to-orange-500/20' },
    'D':  { color: '#f97316', label: 'Almost There! 🎯', bg: 'from-orange-500/20 to-red-500/20' },
    'F':  { color: '#ef4444', label: 'Keep Practicing! 📚', bg: 'from-red-500/20 to-pink-500/20' },
  };
  const gc = gradeConfig[result.grade] || gradeConfig['F'];

  return (
    <StudentLayout title="Exam Result">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Grade Hero */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className={`card bg-gradient-to-br ${gc.bg} text-center py-12`}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4">{result.grade === 'F' ? '📚' : result.percentage >= 80 ? '🏆' : result.percentage >= 60 ? '🎯' : '💪'}</motion.div>
          <h2 className="text-3xl font-black text-white mb-2">{gc.label}</h2>
          <p className="text-gray-400 mb-6">{result.exam?.title}</p>

          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="w-36 h-36">
              <CircularProgressbar value={score} text={`${Math.round(score)}%`}
                styles={buildStyles({
                  textColor: '#fff', textSize: '18px', fontWeight: '900',
                  pathColor: gc.color, trailColor: 'rgba(255,255,255,0.1)',
                  pathTransitionDuration: 1.5
                })} />
            </div>
            <div className="text-center">
              <div className="text-6xl font-black gradient-text">{result.grade}</div>
              <div className="text-gray-400 mt-1">Grade</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-white">{result.score}<span className="text-2xl text-gray-400">/{result.totalMarks}</span></div>
              <div className="text-gray-400 mt-1">Total Score</div>
            </div>
          </div>

          {xpEarned > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className="mt-6 inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-5 py-2 rounded-full">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">+{xpEarned} XP Earned!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Correct', value: result.correctAnswers, icon: CheckCircle, color: 'emerald' },
            { label: 'Wrong', value: result.wrongAnswers, icon: XCircle, color: 'red' },
            { label: 'Skipped', value: result.unattempted, icon: Clock, color: 'gray' },
            { label: 'Time Taken', value: `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, icon: Clock, color: 'indigo' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon className={`w-6 h-6 text-${color}-400 mx-auto mb-2`} />
              <div className={`text-2xl font-black text-${color}-400`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* AI Feedback */}
        {result.aiFeedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" /> AI Performance Analysis
            </h3>
            {result.aiFeedback.summary && (
              <div className="glass rounded-xl p-4 mb-4 border border-indigo-500/20">
                <p className="text-gray-300 leading-relaxed">{result.aiFeedback.summary}</p>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-4">
              {result.aiFeedback.strengths?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> Strengths</h4>
                  <ul className="space-y-1">
                    {result.aiFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.aiFeedback.weakAreas?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-2">⚠️ Weak Areas</h4>
                  <ul className="space-y-1">
                    {result.aiFeedback.weakAreas.map((w, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.aiFeedback.suggestions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 mb-2">💡 Suggestions</h4>
                  <ul className="space-y-1">
                    {result.aiFeedback.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-cyan-400 flex-shrink-0">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Answer Review */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <h3 className="text-lg font-bold text-white mb-4">Answer Review</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-2">
            {result.answers?.map((ans, i) => {
              const q = ans.questionData;
              if (!q) return null;
              return (
                <div key={i} className={`p-4 rounded-xl border ${ans.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : ans.selectedOption ? 'border-red-500/20 bg-red-500/5' : 'border-gray-500/20 bg-gray-500/5'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-gray-500 flex-shrink-0">Q{i + 1}.</span>
                    <p className="text-sm text-gray-300">{q.questionText}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    {ans.selectedOption && (
                      <span className={`px-2 py-1 rounded ${ans.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        Your answer: {ans.selectedOption}. {q.options?.[ans.selectedOption]}
                      </span>
                    )}
                    {!ans.isCorrect && (
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                        Correct: {q.correctAnswer}. {q.options?.[q.correctAnswer]}
                      </span>
                    )}
                    {!ans.selectedOption && <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400">Not attempted</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="flex gap-4">
          <Link to="/student/exams" className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Exams
          </Link>
          <Link to="/student/results" className="btn-secondary">View All Results</Link>
        </div>
      </div>
    </StudentLayout>
  );
}
