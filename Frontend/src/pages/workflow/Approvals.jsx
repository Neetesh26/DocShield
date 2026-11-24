import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, AlertCircle, Lock, Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { approvalService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';

export const Approvals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Approval Action Modal
  const [activeApproval, setActiveApproval] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [comments, setComments] = useState('');
  const [signMeaning, setSignMeaning] = useState('I approve this record in compliance with 21 CFR Part 11 requirements.');
  const [signedCheck, setSignedCheck] = useState(false);
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPassword, setSignerPassword] = useState('');
  const [showSignerPassword, setShowSignerPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await approvalService.getApprovals({ status: statusFilter });
      if (res.success && res.data) {
        setApprovals(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleOpenAction = (approval, type) => {
    setActiveApproval(approval);
    setActionType(type);
    setComments(type === 'approve' ? 'Reviewed and approved in accordance with QA standards.' : 'Rejected per compliance review.');
    setSignedCheck(false);
    setSignerEmail(user?.email || '');
    setSignerPassword('');
    setShowSignerPassword(false);
    setAuthError('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!activeApproval) return;
    setAuthError('');

    if (actionType === 'approve') {
      if (!signerEmail.trim()) {
        setAuthError('Authorized email is required for 21 CFR Part 11 signature.');
        return;
      }
      if (user?.email && signerEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
        setAuthError(`Invalid Email: Please enter your correct authorized email (${user.email}).`);
        return;
      }
      if (!signerPassword) {
        setAuthError('Security password is required for 21 CFR Part 11 electronic signature authentication.');
        return;
      }
      if (!signedCheck) {
        setAuthError('You must confirm the 21 CFR Part 11 electronic signature declaration.');
        return;
      }
    }

    try {
      setSubmitting(true);
      if (actionType === 'approve') {
        await approvalService.approve(
          activeApproval._id,
          comments,
          signMeaning,
          signerPassword,
          signerEmail.trim()
        );
        toast.success('Record approved under 21 CFR Part 11 electronic signature.');
      } else {
        await approvalService.reject(activeApproval._id, comments);
        toast.warning('Record rejected per compliance review.');
      }
      setActiveApproval(null);
      fetchApprovals();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Approval action failed';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">21 CFR Part 11 Approval Cockpit</h1>
          <p className="text-xs text-slate-500">
            Review and digitally execute legally binding electronic approvals and rejections for GxP operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="Pending">Pending Approvals</option>
            <option value="Approved">Approved History</option>
            <option value="Rejected">Rejected History</option>
          </select>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">Approval Type</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-3">Requester</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-4 text-right">Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">Loading approval tasks...</td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">No {statusFilter.toLowerCase()} approval items.</td>
                </tr>
              ) : (
                approvals.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.type}</td>
                    <td className="py-3 px-4 truncate max-w-xs">
                      <div className="font-mono font-bold text-orange-700">
                        {item.document?.documentNumber || item.request?.document?.documentNumber || item.request?.documentNumber || 'System Record'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.document?.title || item.request?.document?.title || item.request?.title || 'GxP Process Record'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{item.request?.requester?.name || item.request?.requesterName || 'Authorized Staff'}</td>
                    <td className="py-3 px-3 text-slate-600">{item.document?.department || item.request?.document?.department || item.request?.department || 'GxP Operations'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === 'Approved'
                          ? 'bg-orange-50 text-orange-800 border border-orange-200'
                          : item.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAction(item, 'approve')}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold shadow-2xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenAction(item, 'reject')}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.electronicSignature?.signedBy || 'Signed'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval / Rejection 21 CFR Modal */}
      {activeApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {actionType === 'approve' ? '21 CFR Part 11 Electronic Signature & Approval' : 'Rejection Justification'}
                </h3>
              </div>
              <button onClick={() => setActiveApproval(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
              <div><strong className="text-slate-700">Action:</strong> {activeApproval.type}</div>
              <div>
                <strong className="text-slate-700">Document:</strong>{' '}
                <span className="font-mono font-bold text-orange-700">
                  {activeApproval.document?.documentNumber || activeApproval.request?.document?.documentNumber || activeApproval.request?.documentNumber || 'System Record'}
                </span>
                {(activeApproval.document?.title || activeApproval.request?.document?.title || activeApproval.request?.title) && (
                  <span className="text-slate-600">
                    {' '}({activeApproval.document?.title || activeApproval.request?.document?.title || activeApproval.request?.title})
                  </span>
                )}
              </div>
              <div>
                <strong className="text-slate-700">Department:</strong>{' '}
                {activeApproval.document?.department || activeApproval.request?.document?.department || activeApproval.request?.department || user?.department || 'GxP Operations'}
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {actionType === 'approve' ? 'Approval Comments / Review Notes *' : 'Reason for Rejection *'}
                </label>
                <textarea
                  required
                  rows="2"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter QA verification details or review comments..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                ></textarea>
              </div>

              {actionType === 'approve' && (
                <div className="space-y-3 pt-1">
                  {/* Authentication Section */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                      Signer Re-Authentication (21 CFR § 11.200)
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Authorized Email Address *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={signerEmail}
                          onChange={(e) => {
                            setSignerEmail(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="e.g. user@vidyagxp.com"
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Security Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showSignerPassword ? 'text' : 'password'}
                          required
                          value={signerPassword}
                          onChange={(e) => {
                            setSignerPassword(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="Enter your login password to sign"
                          className="w-full pl-8 pr-8 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <button
                          type="button"
                          onClick={() => setShowSignerPassword(!showSignerPassword)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          {showSignerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Identity verification is required before executing electronic signatures.
                      </p>
                    </div>
                  </div>

                  {/* Legal Declaration */}
                  <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl space-y-2">
                    <div className="text-[11px] text-orange-900 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-700" />
                      Electronic Signature Declaration
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-serif italic">
                      "{signMeaning}"
                    </p>
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={signedCheck}
                        onChange={(e) => setSignedCheck(e.target.checked)}
                        className="rounded text-orange-600 border-slate-300 focus:ring-orange-500"
                      />
                      <span className="text-[11px] font-semibold text-slate-800">
                        I, {user?.name || 'Signer'} ({user?.role || 'Authorized User'}), execute this signature.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveApproval(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 text-white font-semibold rounded-lg shadow-sm transition ${
                    actionType === 'approve' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Verifying & Executing...' : actionType === 'approve' ? 'Sign & Approve' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

