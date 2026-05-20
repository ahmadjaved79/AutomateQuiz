import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, LayoutDashboard, BookOpen, Users, Layers, BarChart3, LogOut, Shield, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/exams', icon: BookOpen, label: 'Exams' },
  { to: '/admin/exams/create', icon: Plus, label: 'Create Exam' },
  { to: '/admin/batches', icon: Layers, label: 'Batches' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen mesh-bg flex font-poppins">
      {/* Sidebar */}
      <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="w-64 min-h-screen glass border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-white text-sm">QuizMaster AI</div>
              <div className="text-xs text-gray-500">Admin Portal</div>
            </div>
          </div>
        </div>

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
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-indigo-400">Administrator</div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <div className="sticky top-0 z-30 glass border-b border-white/5 px-8 py-4">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
