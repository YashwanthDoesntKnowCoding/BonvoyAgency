import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await api.post(`/auth/${mode}`, payload);
      const result = response.data.data;
      login({ user: result.user, token: result.accessToken });
      toast.success(mode === 'register' ? 'Your account is ready.' : 'Welcome back.');
      navigate('/');
    } catch (error) {
      setErrorMessage(error.response?.data?.error?.message || error.response?.data?.message || 'We could not complete that request. Check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container auth-shell">
      <div className="auth-card">
        <div className="tab-row">
          <button type="button" className={mode === 'login' ? 'active' : ''} aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setErrorMessage(''); }}>Login</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setErrorMessage(''); }}>Register</button>
        </div>
        <form onSubmit={handleSubmit} className="stack-form">
          {mode === 'register' && (
            <label>
              Full name
              <input name="full_name" placeholder="Your name" minLength="2" required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          </label>
          {mode === 'register' && (
            <label>
              Phone
              <input name="phone" type="tel" minLength="8" placeholder="+91 9876543210" required />
            </label>
          )}
          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
