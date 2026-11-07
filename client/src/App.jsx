import React from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Generator from './pages/Generator.jsx';
import Library from './pages/Library.jsx';
import Review from './pages/Review.jsx';
import Analytics from './pages/Analytics.jsx';

function Protected({ children }) {
  const { authed } = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

function Shell({ children }) {
  const { logout } = useAuth();
  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`;
  return (
    <div className="min-h-screen">
      <header className="bg-brand-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-lg font-bold text-white">Innoventure Content Studio</div>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={link}>New content</NavLink>
            <NavLink to="/library" className={link}>Library</NavLink>
            <NavLink to="/analytics" className={link}>Analytics</NavLink>
            <button onClick={logout} className="ml-2 rounded-lg border border-white/40 px-3 py-2 text-sm font-medium text-white hover:bg-white/10">Sign out</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Shell><Generator /></Shell></Protected>} />
      <Route path="/library" element={<Protected><Shell><Library /></Shell></Protected>} />
      <Route path="/content/:id" element={<Protected><Shell><Review /></Shell></Protected>} />
      <Route path="/analytics" element={<Protected><Shell><Analytics /></Shell></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
