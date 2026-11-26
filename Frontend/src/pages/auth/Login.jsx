import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button3D } from '../../components/common/Button3D';

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const { setThemePreference } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Reset to clean corporate light mode for the login portal
    setThemePreference('light');
  }, [setThemePreference]);

  useEffect(() => {
    // If user is already authenticated and verified, redirect to dashboard
    if (isAuthenticated) {
      navigate('/workspace/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg('Authentication successful. Redirecting to repository...');
        setTimeout(() => {
          navigate('/workspace/dashboard');
        }, 300);
      } else {
        setError(res.message || 'Invalid corporate email or security password credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Ensure backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(195, 157, 137, 0.25), rgba(254, 243, 199, 0.92)),
          url('https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=2000&auto=format&fit=crop')
        `
      }}
    >
      {/* Decorative Subtle Bhagwa Saffron Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-orange-300/20 via-transparent to-transparent pointer-events-none" />

      {/* Main Single Centered Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-orange-200/80 p-8 z-10 space-y-6">
        
        {/* Brand Header: Deep Slate (#0F172A) + Bhagwa Orange (#EA580C) Accent */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-orange-500 font-bold shadow-md border border-slate-800 mx-auto">
            <Shield className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
              VidyaGxP
              {/* <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                GxP
              </span> */}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Pharmaceutical Document Security & Repository
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corporate Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@docushield.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-orange-600 transition cursor-pointer p-1 rounded"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button3D
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? 'Authenticating with 21 CFR...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4 ml-1.5 inline" />
          </Button3D>
        </form>

        {/* Regulatory Notice */}
        {/* <div className="pt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 border-t border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
          <span>Regulated by US FDA 21 CFR Part 11 & EU Annex 11</span>
        </div> */}
      </div>
    </div>
  );
};
