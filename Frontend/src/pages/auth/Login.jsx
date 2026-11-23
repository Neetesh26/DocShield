import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';

// The 6 GxP Quick Sign-In Users matching the system access levels
const QUICK_USERS = [
  {
    initials: 'AS',
    name: 'Anita Sharma',
    role: 'Admin',
    description: 'Admin · Master data, users, rules & settings',
    email: 'anita.sharma@docushield.com',
    password: 'DocuShield@2026',
    department: 'Executive Administration'
  },
  {
    initials: 'MI',
    name: 'Dr. Meera Iyer',
    role: 'QA Manager',
    description: 'QA Manager · Approvals, audit trail, reports',
    email: 'meera.iyer@docushield.com',
    password: 'DocuShield@2026',
    department: 'Quality Assurance'
  },
  {
    initials: 'SP',
    name: 'Suresh Patil',
    role: 'Document Controller',
    description: 'Document Controller · Upload, issue/receive, physical audits',
    email: 'suresh.patil@docushield.com',
    password: 'DocuShield@2026',
    department: 'Document Control'
  },
  {
    initials: 'RV',
    name: 'Rahul Verma',
    role: 'Custodian',
    description: 'Custodian · Owns department documents, handovers',
    email: 'rahul.verma@docushield.com',
    password: 'DocuShield@2026',
    department: 'Production'
  },
  {
    initials: 'PN',
    name: 'Priya Nair',
    role: 'Custodian',
    description: 'Custodian · Owns department documents, handovers',
    email: 'priya.nair@docushield.com',
    password: 'DocuShield@2026',
    department: 'Quality Control'
  },
  {
    initials: 'AK',
    name: 'Amit Kumar',
    role: 'User / Viewer',
    description: 'User / Viewer · Search, view, chat, raise requests',
    email: 'amit.kumar@docushield.com',
    password: 'DocuShield@2026',
    department: 'Operations & R&D'
  }
];

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState(QUICK_USERS[0]);
  const [email, setEmail] = useState(QUICK_USERS[0].email);
  const [password, setPassword] = useState(QUICK_USERS[0].password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelectQuickUser = (acc) => {
    setSelectedUser(acc);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setSuccessMsg('');
  };

  const handleQuickSignIn = async (acc) => {
    setSelectedUser(acc);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login(acc.email, acc.password);
      if (res.success) {
        setSuccessMsg(`Welcome, ${acc.name}! Accessing ${acc.role} workspace...`);
        setTimeout(() => {
          navigate('/workspace/dashboard');
        }, 300);
      } else {
        setError(res.message || 'Authentication failed. Please verify the backend and database are running.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/workspace/dashboard');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Left Side: GxP Brand & Compliance Context */}
        <div className="bg-gradient-to-br from-purple-50 via-violet-50/70 to-white p-8 md:p-10 text-slate-800 flex flex-col justify-between border-b md:border-b-0 md:border-r border-purple-100">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  DocuShield
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                    GxP
                  </span>
                </h1>
                <p className="text-xs text-purple-700 font-medium">Enterprise Physical &amp; Electronic Document Management</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Select an authorized personnel card to test specific role permissions.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-xl border border-purple-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">FDA 21 CFR Part 11 Compliant:</span> Enforces electronic signatures, immutable audit trails, and strict role permissions.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-xl border border-purple-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">Hierarchical Physical Tracking:</span> Coordinate records down to building, room, rack, shelf, and bin with secure QR tracking.
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

          <div className="pt-6 mt-6 border-t border-purple-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-medium text-purple-800">Powered by VidyaGxP Suite</span>
            <span className="font-mono text-slate-400">v1.0.4-PROD</span>
          </div>
        </div>

        {/* Right Side: Quick Sign-In + Form */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Quick Sign-In by GxP Role</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
              6 Roles
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {QUICK_USERS.map((acc) => {
              const isSelected = selectedUser?.email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectQuickUser(acc)}
                  onDoubleClick={() => handleQuickSignIn(acc)}
                  disabled={loading}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/10'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  } disabled:opacity-60`}
                  title={`Click to select, double-click to sign in as ${acc.name}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${isSelected ? 'bg-purple-600' : 'bg-slate-700'}`}>
                      {acc.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs truncate">{acc.name}</span>
                        {isSelected && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded-full border border-purple-200">
                            <Check className="w-2.5 h-2.5 mr-0.5" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{acc.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-purple-700">Sign in</span>
                </button>
              );
            })}
          </div>

          {selectedUser && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Signing in as</span>
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900 text-xs">{selectedUser.name}</div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-purple-800 border border-purple-200">
                  {selectedUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Department: {selectedUser.department}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@docushield.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>
            </div>

            <Button3D type="submit" variant="primary" size="md" disabled={loading} className="w-full">
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </Button3D>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_USERS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickSignIn(acc)}
                disabled={loading}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/60 text-[11px] transition disabled:opacity-60"
              >
                <div className="font-medium text-slate-800 truncate">{acc.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{acc.role}</div>
              </button>
            ))}
          </div>

          <div className="text-center text-[11px] text-slate-400">
            Audit logging active. All access attempts are recorded.
          </div>
        </div>
      </div>
    </div>
  );
};
