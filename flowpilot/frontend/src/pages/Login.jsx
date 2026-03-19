import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import { authApi } from '../api/services';
import { Lock, Mail, Boxes } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('admin@flowpilot.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      dispatch(setCredentials(response));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-icon">
            <Boxes size={32} />
          </div>
          <h1 className="login-title">FlowPilot</h1>
          <p className="login-subtitle">Operations Workflow Suite</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                required
                className="login-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                required
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-submit-btn">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="login-footer">
            <p className="demo-text">
              Demo access: <span className="demo-credentials">admin@flowpilot.app / password123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
