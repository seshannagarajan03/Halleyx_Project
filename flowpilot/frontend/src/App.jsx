import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import ExecutionDashboard from './pages/ExecutionDashboard';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import { logout } from './store/slices/authSlice';
import { Boxes, Terminal, Shield, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './App.css';

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Boxes size={24} />
          </div>
          <span className="brand-name">FlowPilot</span>
        </div>

        <nav className="sidebar-nav">
          <Link to="/workflows" className={`nav-link ${location.pathname.startsWith('/workflows') || location.pathname === '/' ? 'active' : ''}`}>
            <Boxes size={20} /> Workflow Library
          </Link>
          <Link to="/audit" className={`nav-link ${location.pathname === '/audit' ? 'active' : ''}`}>
            <Terminal size={20} /> Execution History
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-console">
            <Shield size={18} /> {user?.role || 'User'} 
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <div className="header-title">Workflow Automation Platform</div>
          <div className="header-user">
            <span className="user-role">{user?.name || 'User'}</span>
            <div className="user-avatar">{user?.name?.substring(0, 2)?.toUpperCase() || 'U'}</div>
          </div>
        </header>

        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<WorkflowList />} />
          <Route path="/workflows" element={<WorkflowList />} />
          <Route path="/workflows/:id" element={<WorkflowEditor />} />
          <Route path="/execute/:id" element={<ExecutionDashboard />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
