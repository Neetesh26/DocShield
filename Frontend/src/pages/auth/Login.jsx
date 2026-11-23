import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@docushield.com');
  const [password, setPassword] = useState('DocuShield@2026');
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Left Side: GxP Brand & Compliance Context (Light Violet Style) */}
        <div className="bg-gradient-to-br from-purple-50 via-violet-50/70 to-white p-8 md:p-10 text-slate-800 flex flex-col justify-between border-r border-purple-100">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  DocuShield
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">GxP</span>
                </h1>
                <p className="text-xs text-purple-700 font-medium">Enterprise Physical & Electronic Document Management</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-xl border border-purple-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">FDA 21 CFR Part 11 Compliant:</span> Enforces electronic signatures, immutable audit trails, and strict role permissions.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-xl border border-purple-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">Hierarchical Physical Tracking:</span> Coordinate records down to Building, Room, Rack, Shelf, and Bin with secure QR tracking.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-xl border border-purple-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">Intelligent Header Extraction:</span> Automated metadata extraction, confidence scores, and duplicate detection.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-purple-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-medium text-purple-800">Powered by VidyaGxP Suite</span>
            <span className="font-mono text-slate-400">v1.0.4-PROD</span>
          </div>
        </div>

        {/* Right Side: Login Form & Demo Selectors */}
        <div className="p-8 md:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Sign in to Document Workspace</h2>
              <p className="text-xs text-slate-500 mt-1">Authorized pharmaceutical and QA personnel only.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                  />
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
                <ArrowRight className="w-4 h-4" />
              </Button3D>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
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
                        ? 'border-purple-500 bg-purple-50/80 text-purple-900 font-semibold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-medium truncate">{acc.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.dept}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-400">
            Audit logging active. All access attempts are recorded.
          </div>
        </div>

      </div>
    </div>
  );
};

