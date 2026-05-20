import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, LayoutDashboard, BookOpen, Trophy, User, LogOut, Star, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/exams', icon: BookOpen, label: 'My Exams' },
  { to: '/student/results', icon: Trophy, label: 'Results' },
  { to: '/student/profile', icon: User, label: 'Profile' }
];

export default function StudentLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const levelProgress = user ? (user.xpPoints % 100) : 0;

  return (
    <div className="min-h-screen mesh-bg flex font-poppins">
      <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="w-64 min-h-screen glass border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-white text-sm">QuizMaster AI</div>
              <div className="text-xs text-gray-500">Student Portal</div>
            </div>
          </div>
        </div>

        {/* XP Widget */}
        {user && (
          <div className="p-4 border-b border-white/5">
            <div className="glass rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-bold">Level {user.level}</span>
                </div>
                <span className="text-xs text-gray-500">{user.xpPoints} XP</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full progress-bar rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1 }} />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">{levelProgress}/100 to next level</div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="glass rounded-xl p-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{user?.batch?.name || 'No batch'}</div>
              </div>
              {user?.badges?.length > 0 && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 ml-64">
        <div className="sticky top-0 z-30 glass border-b border-white/5 px-8 py-4">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
