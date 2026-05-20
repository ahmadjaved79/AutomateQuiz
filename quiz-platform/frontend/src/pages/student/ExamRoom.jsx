import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Maximize } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [startedAt] = useState(new Date());
  const submitted = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [examRes, qRes] = await Promise.all([api.get(`/exams/${examId}`), api.get(`/exams/${examId}/questions`)]);
        setExam(examRes.data);
        setQuestions(qRes.data);
        setTimeLeft(examRes.data.duration * 60);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load exam');
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  // Request fullscreen
  useEffect(() => {
    if (!loading && questions.length > 0) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, [loading, questions.length]);

  // Anti-cheat: Tab switch detection
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.hidden && !submitted.current) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        const msg = newCount >= 3 ? '⚠️ Maximum tab switches reached! Auto-submitting...' : `⚠️ Tab switch detected! Warning ${newCount}/3`;
        showWarningPopup(msg);

        try {
          const { data } = await api.post('/anticheat/log', { examId, violationType: 'tab_switch' });
          if (data.shouldAutoSubmit && !submitted.current) {
            toast.error('Auto-submitted: too many tab switches!');
            await submitExam(true);
          }
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [tabSwitches, answers]);

  // Anti-cheat: Fullscreen exit
  useEffect(() => {
    const handleFullscreen = async () => {
      if (!document.fullscreenElement && !submitted.current) {
        showWarningPopup('⚠️ Fullscreen exit detected! Please stay in fullscreen mode.');
        try { await api.post('/anticheat/log', { examId, violationType: 'fullscreen_exit' }); } catch {}
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  // Anti-cheat: Copy/Paste/Right-click
  useEffect(() => {
    const block = async (e, type) => {
      e.preventDefault();
      try { await api.post('/anticheat/log', { examId, violationType: type }); } catch {}
    };
    const handlers = [
      ['copy', (e) => block(e, 'copy_attempt')],
      ['paste', (e) => block(e, 'paste_attempt')],
      ['cut', (e) => block(e, 'cut_attempt')],
      ['contextmenu', (e) => block(e, 'right_click')]
    ];
    handlers.forEach(([ev, fn]) => document.addEventListener(ev, fn));
    return () => handlers.forEach(([ev, fn]) => document.removeEventListener(ev, fn));
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    if (timeLeft === 0 && !submitted.current) {
      submitExam(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { submitExam(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const showWarningPopup = (msg) => {
    setWarningMsg(msg);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);
  };

  const submitExam = useCallback(async (autoSubmit = false) => {
    if (submitted.current || submitting) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      document.exitFullscreen?.().catch(() => {});
      const { data } = await api.post('/results/submit', {
        examId,
        answers,
        timeTaken: exam ? exam.duration * 60 - timeLeft : 0,
        isAutoSubmitted: autoSubmit,
        startedAt: startedAt.toISOString()
      });
      navigate(`/student/result/${data.result._id}`, { state: { xpEarned: data.xpEarned } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      submitted.current = false;
      setSubmitting(false);
    }
  }, [answers, exam, timeLeft, examId, navigate, submitting]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const attempted = Object.keys(answers).filter(k => answers[k]).length;
  const progress = questions.length ? (attempted / questions.length) * 100 : 0;

  if (loading) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading exam...</p>
      </div>
    </div>
  );

  const q = questions[current];
  const isLowTime = timeLeft < 300;

  return (
    <div className="min-h-screen mesh-bg font-poppins no-select flex flex-col" style={{ userSelect: 'none' }}>
      {/* Warning Popup */}
      <AnimatePresence>
        {showWarning && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 rounded-2xl px-8 py-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <span className="text-white font-bold">{warningMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="glass border-b border-white/5 px-6 py-3 flex items-center justify-between flex-wrap gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">{exam?.title}</h1>
          <p className="text-xs text-gray-400">{exam?.domain} • {exam?.difficulty}</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Tab switch indicator */}
          {tabSwitches > 0 && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{tabSwitches}/3 warnings</span>
            </div>
          )}

          {/* Timer */}
          <div className={`flex items-center gap-2 text-xl font-black ${isLowTime ? 'timer-warning' : 'text-white'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>

          {/* Progress */}
          <div className="text-sm text-gray-400">
            <span className="text-indigo-400 font-bold">{attempted}</span>/{questions.length} answered
          </div>

          <button onClick={() => { if (confirm('Submit exam now?')) submitExam(); }}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 text-sm">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Submit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div className="h-full progress-bar" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main question area */}
        <div className="flex-1 flex flex-col p-6 md:p-10">
          <AnimatePresence mode="wait">
            {q && (
              <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
                {/* Question */}
                <div className="card mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {current + 1}
                    </span>
                    <span className="text-xs text-gray-500">Question {current + 1} of {questions.length}</span>
                  </div>
                  <p className="text-white text-lg font-medium leading-relaxed">{q.questionText}</p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(q.options || {}).map(([key, value]) => {
                    const isSelected = answers[q._id] === key;
                    return (
                      <motion.button key={key} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        onClick={() => setAnswers(a => ({ ...a, [q._id]: key }))}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                            : 'glass border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}>{key}</span>
                        <span className={`${isSelected ? 'text-white' : 'text-gray-300'}`}>{value}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-gray-500 text-sm">{current + 1} / {questions.length}</span>
            <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Palette */}
        <div className="w-64 glass border-l border-white/5 p-4 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-400 mb-3">Question Palette</h3>
          <div className="grid grid-cols-5 gap-1.5 mb-6">
            {questions.map((qq, i) => {
              const isAnswered = !!answers[qq._id];
              const isCurrent = i === current;
              return (
                <motion.button key={i} whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrent(i)}
                  className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${
                    isCurrent ? 'ring-2 ring-indigo-500 bg-indigo-500 text-white' :
                    isAnswered ? 'bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/40' :
                    'bg-white/5 text-gray-500 hover:bg-white/10'
                  }`}>
                  {i + 1}
                </motion.button>
              );
            })}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/30" />
              <span className="text-gray-400">Answered ({attempted})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5" />
              <span className="text-gray-400">Not answered ({questions.length - attempted})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-indigo-500 bg-indigo-500" />
              <span className="text-gray-400">Current</span>
            </div>
          </div>

          <div className="mt-6 glass rounded-xl p-3 text-center">
            <div className="text-2xl font-black gradient-text">{Math.round(progress)}%</div>
            <div className="text-xs text-gray-500">Completed</div>
            <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full progress-bar rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
