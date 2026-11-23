import React, { useState } from 'react';
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
  Zap,
  ShieldCheck,
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
    department: 'Executive Administration',
    badge: 'Super Admin'
  },
  {
    initials: 'MI',
    name: 'Dr. Meera Iyer',
    role: 'QA Manager',
    description: 'QA Manager · Approvals, audit trail, reports',
    email: 'meera.iyer@docushield.com',
    password: 'DocuShield@2026',
    department: 'Quality Assurance',
    badge: 'QA Lead'
  },
  {
    initials: 'SP',
    name: 'Suresh Patil',
    role: 'Document Controller',
    description: 'Document Controller · Upload, issue/receive, physical audits',
    email: 'suresh.patil@docushield.com',
    password: 'DocuShield@2026',
    department: 'Document Control',
    badge: 'Doc Control'
  },
  {
    initials: 'RV',
    name: 'Rahul Verma',
    role: 'Custodian',
    description: 'Custodian · Owns department documents, handovers',
    email: 'rahul.verma@docushield.com',
    password: 'DocuShield@2026',
    department: 'Production',
    badge: 'Custodian (Prod)'
  },
  {
    initials: 'PN',
    name: 'Priya Nair',
    role: 'Custodian',
    description: 'Custodian · Owns department documents, handovers',
    email: 'priya.nair@docushield.com',
    password: 'DocuShield@2026',
    department: 'Quality Control',
    badge: 'Custodian (QC)'
  },
  {
    initials: 'AK',
    name: 'Amit Kumar',
    role: 'User / Viewer',
    description: 'User / Viewer · Search, view, chat, raise requests',
    email: 'amit.kumar@docushield.com',
    password: 'DocuShield@2026',
    department: 'Operations & R&D',
    badge: 'Viewer'
  }
];

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Selected quick user (defaults to Anita Sharma)
  const [selectedUser, setSelectedUser] = useState(QUICK_USERS[0]);
  const [email, setEmail] = useState(QUICK_USERS[0].email);
  const [password, setPassword] = useState(QUICK_USERS[0].password);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click Select User
  const handleSelectQuickUser = (acc) => {
    setSelectedUser(acc);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  // 1-Click Direct Quick Login
  const handleQuickSignIn = async (acc) => {
    setSelectedUser(acc);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setLoading(true);

    try {
      const res = await login(acc.email, acc.password);
      if (res.success) {
        setSuccessMsg(`Welcome, ${acc.name}! Accessing ${acc.role} Workspace...`);
        setTimeout(() => {
          navigate('/workspace/dashboard');
        }, 300);
      } else {
        setError(res.message || 'Authentication failed. Please verify database connection.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Ensure MongoDB and backend server are running.');
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
        setError(res.message || 'Invalid email or password credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(254, 243, 199, 0.92)),
          url('https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=2000&auto=format&fit=crop')
        `
      }}
    >
      {/* Decorative Subtle Bhagwa Saffron Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-orange-300/20 via-transparent to-transparent pointer-events-none" />

      {/* Main Dual-Pane Card */}
      <div className="relative w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-orange-200/80 p-6 md:p-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT SECTION: 6 Quick Sign-In User Cards (Exact Match to Reference in Bhagwa Orange) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-orange-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-orange-100 text-orange-700">
                  <Zap className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Quick Sign-In by GxP Role
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an authorized personnel card to test specific role permissions.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-semibold">
              6 Role Personas
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5">
            {QUICK_USERS.map((acc) => {
              const isSelected = selectedUser?.email === acc.email;
              return (
                <div
                  key={acc.email}
                  onClick={() => handleSelectQuickUser(acc)}
                  onDoubleClick={() => handleQuickSignIn(acc)}
                  className={`group relative p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-2 border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/10'
                      : 'border border-slate-200 hover:border-orange-300 hover:bg-orange-50/20'
                  }`}
                  title={`Click to select, double-click to sign in as ${acc.name}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Human Enterprise Initials Circle: Deep Charcoal Slate + Active Bhagwa */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs transition-colors ${
                        isSelected ? 'bg-orange-600 ring-2 ring-orange-400/40' : 'bg-slate-800'
                      }`}
                    >
                      {acc.initials}
                    </div>

                    {/* Name & Subtitle */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                          {acc.name}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-orange-800 bg-orange-100 px-1.5 py-0.2 rounded-full border border-orange-200">
                            <Check className="w-2.5 h-2.5 mr-0.5" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {acc.description}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Fast Login Trigger */}
                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickSignIn(acc);
                      }}
                      disabled={loading}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-800'
                      }`}
                    >
                      <span>1-Click</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Password for all test personas: <code className="font-mono font-semibold text-orange-800 bg-orange-50 px-1 py-0.5 rounded">DocuShield@2026</code></span>
            <span className="text-orange-700 font-medium">21 CFR Part 11 Compliant</span>
          </div>
        </div>

        {/* RIGHT SECTION: Sign In Form with Selected Persona Details */}
        <div className="lg:col-span-5 bg-orange-50/40 rounded-2xl border border-orange-200/80 p-6 space-y-5">
          {/* Brand Header: Deep Slate (#0F172A) + Bhagwa Orange (#EA580C) Accent */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-orange-500 font-bold shadow-md border border-slate-800">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                DocuShield
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                  GxP
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Pharmaceutical Document Security & Custody
              </p>
            </div>
          </div>

          {/* Currently Selected User Summary Pill */}
          {selectedUser && (
            <div className="p-3 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                Signing In As:
              </span>
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs">
                  {selectedUser.name}
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                  {selectedUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Department: {selectedUser.department}
              </p>
            </div>
          )}

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
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@docushield.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-orange-600 transition cursor-pointer p-0.5 rounded"
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
              {loading ? 'Authenticating with 21 CFR...' : `Sign In as ${selectedUser?.role || 'User'}`}
              <ArrowRight className="w-4 h-4 ml-1.5 inline" />
            </Button3D>
          </form>

          {/* Regulatory Notice */}
          <div className="pt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            <span>Regulated by US FDA 21 CFR Part 11 & EU Annex 11</span>
          </div>
        </div>

      </div>
    </div>
  );
};
