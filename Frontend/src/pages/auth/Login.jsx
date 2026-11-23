import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@docushield.com');
  const [password, setPassword] = useState('DocuShield@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'System Admin', email: 'admin@docushield.com', role: 'Admin', dept: 'QA & Compliance' },
    { label: 'QA Lead', email: 'qa@docushield.com', role: 'QA', dept: 'Quality Assurance' },
    { label: 'Doc Controller', email: 'doccontrol@docushield.com', role: 'Document Controller', dept: 'Doc Control' },
    { label: 'Dept Head', email: 'depthead@docushield.com', role: 'Department Head', dept: 'Production' },
    { label: 'QC Analyst', email: 'analyst@docushield.com', role: 'Employee', dept: 'Quality Control' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/workspace/dashboard');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Ensure MongoDB and backend server are running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword('DocuShield@2026');
    setError('');
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(250, 245, 255, 0.90), rgba(243, 232, 255, 0.88)),
          url('https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=2000&auto=format&fit=crop'),
          url('/images/login-bg.svg')
        `
      }}
    >
      {/* Decorative Blur Backing */}
      <div className="absolute inset-0 bg-radial from-purple-200/20 via-transparent to-transparent pointer-events-none" />

      {/* Centered Login Form Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-100 p-8 z-10 transition-all">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">DocuShield</h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
              GxP
            </span>
          </div>
          <p className="text-xs text-purple-700 font-medium mt-1">
            Enterprise Physical & Electronic Document Management
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Authorized pharmaceutical and QA personnel only
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@docushield.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-purple-600 transition focus:outline-none"
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
            {loading ? 'Authenticating...' : 'Sign In with 21 CFR Credentials'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button3D>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            Quick Demo Accounts (1-Click Login):
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className={`text-left p-2 rounded-lg border text-[11px] transition ${
                  email === acc.email
                    ? 'border-purple-500 bg-purple-50/80 text-purple-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-medium truncate">{acc.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{acc.dept}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Powered by VidyaGxP</span>
          <span className="font-mono">v1.0.4-PROD</span>
        </div>
      </div>
    </div>
  );
};
