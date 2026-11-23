import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, User, UserPlus, Building2, Briefcase, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';

export const Login = ({ initialRegister = false }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(initialRegister);

  // Login Form State
  const [email, setEmail] = useState('admin@docushield.com');
  const [password, setPassword] = useState('DocuShield@2026');

  // Register Form State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Quality Assurance',
    role: 'Employee',
    employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    designation: 'GxP Document Specialist',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const demoAccounts = [
    { label: 'System Admin', email: 'admin@docushield.com', role: 'Admin', dept: 'QA & Compliance' },
    { label: 'QA Lead', email: 'qa@docushield.com', role: 'QA', dept: 'Quality Assurance' },
    { label: 'Doc Controller', email: 'doccontrol@docushield.com', role: 'Document Controller', dept: 'Doc Control' },
    { label: 'Dept Head', email: 'depthead@docushield.com', role: 'Department Head', dept: 'Production' },
    { label: 'QC Analyst', email: 'analyst@docushield.com', role: 'Employee', dept: 'Quality Control' }
  ];

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
      setError(err.response?.data?.message || 'Login failed. Ensure MongoDB and backend server are running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await register(regData);
      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          navigate('/workspace/dashboard');
        }, 600);
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword('DocuShield@2026');
    setError('');
    setIsRegister(false);
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
        
        {/* Left Side: GxP Brand & Compliance Context */}
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

        {/* Right Side: Login & Register Forms */}
        <div className="p-8 md:p-10 flex flex-col justify-between bg-white max-h-[90vh] overflow-y-auto">
          <div>
            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  !isRegister
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  isRegister
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register New User
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {isRegister ? 'Create GxP User Account' : 'Sign in to Document Workspace'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isRegister
                  ? 'Enroll new authorized personnel into the GxP system.'
                  : 'Authorized pharmaceutical and QA personnel only.'}
              </p>
            </div>
          </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {!isRegister ? (
              <>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Quick Demo Accounts (1-Click Login):
                    </span>
                  </div>
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

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setError(''); }}
                    className="text-xs text-purple-700 hover:text-purple-900 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Don't have an account? Register new user
                  </button>
                </div>
              </>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regData.name}
                      onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="john.doe@docushield.com"
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="Min 6 chars"
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                    <div className="relative">
                      <BadgeCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regData.employeeId}
                        onChange={(e) => setRegData({ ...regData, employeeId: e.target.value })}
                        placeholder="EMP-QA-101"
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GxP Role</label>
                    <select
                      value={regData.role}
                      onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition bg-white"
                    >
                      <option value="Employee">Employee (QC / Operator)</option>
                      <option value="QA">QA (Quality Assurance)</option>
                      <option value="Document Controller">Document Controller</option>
                      <option value="Department Head">Department Head</option>
                      <option value="Admin">System Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <select
                        value={regData.department}
                        onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition bg-white"
                      >
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Document Control">Document Control</option>
                        <option value="Production">Production</option>
                        <option value="Quality Control">Quality Control</option>
                        <option value="Regulatory Affairs">Regulatory Affairs</option>
                        <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                        <option value="Information Technology">Information Technology</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={regData.designation}
                      onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                      placeholder="e.g. Validation Specialist"
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                    />
                  </div>
                </div>

                <Button3D
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  className="w-full mt-3"
                >
                  {loading ? 'Creating GxP Account...' : 'Enroll & Sign In with 21 CFR'}
                  <UserPlus className="w-4 h-4" />
                </Button3D>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setError(''); }}
                    className="text-xs text-purple-700 hover:text-purple-900 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            )}
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
