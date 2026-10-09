import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      nav(user.role === 'admin' ? '/users' : '/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-outer">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo-wrap">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVR2d6lmrS7N948j0uU7skVCqkEQx0KQqWSx4GMTeB7vAXrpBoMKDDfTi4qCH_NBMfrZkSdvnK_V8fx278zl-cSnlQdJBvbLbFpxmXjqEulCrGurqQm2w0Pb54_hWy-l1VuYFZLtg_1OvyQ23wLYWf_MgqO8uvJUX6gx9j7wfUGhWmrk9OrIZgT5R40JR0uwBWN6f3yFqwUe8T1_ZDlyIuBGI_VNhapqrLKbxKXmAkotd8KbXMDdfk_Q"
              alt="Training Centre Emblem"
              className="login-logo-img"
            />
          </div>
          <div className="login-brand-name">
            <span className="login-brand-primary">TRAINING</span>
            <span className="login-brand-secondary">CENTRE</span>
          </div>
          <p className="login-brand-sub">Community Workshop Management Portal</p>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Sign in</h1>
            <p className="login-subtitle">Enter your staff email and password to access the desk</p>
          </div>

          <form className="login-form" onSubmit={submit}>
            {/* Email */}
            <div className="login-field">
              <div className="login-field-label-row">
                <label htmlFor="email" className="login-label">Email address</label>
                <span className="login-required">Required</span>
              </div>
              <div className="login-input-wrap">
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="e.g. nimal.perera@trainingcentre.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input login-input--password"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <span className="material-symbols-outlined login-toggle-icon">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error-box">
                <span className="material-symbols-outlined login-error-icon">error</span>
                <div className="login-error-text">
                  <span className="login-error-title">Invalid credentials</span>
                  <span className="login-error-desc">{error}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              <span>{loading ? 'Signing in\u2026' : 'Login'}</span>
              {!loading && (
                <span className="material-symbols-outlined login-btn-icon">arrow_forward</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <div className="login-footer-note">
            <span className="material-symbols-outlined login-footer-icon">admin_panel_settings</span>
            <span>Accounts are created by your administrator.</span>
          </div>
          <div className="login-footer-centres">
            <span>Lakeside</span>
            <span>•</span>
            <span>City Centre</span>
            <span>•</span>
            <span>North Centre</span>
          </div>
        </div>
      </div>
    </main>
  );
}