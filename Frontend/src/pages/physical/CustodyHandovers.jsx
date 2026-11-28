import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, UserCheck, Clock, CheckCircle, XCircle, Plus, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { handoverService, masterDataService, documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';

export const CustodyHandovers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMy, setFilterMy] = useState(false);

  // New Handover Modal
  const [showModal, setShowModal] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [targetCustodianId, setTargetCustodianId] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custody Action Modal (Accept / Reject under 21 CFR Part 11)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    handover: null,
    type: 'accept', // 'accept' | 'reject'
    remarks: '',
    acknowledged: false,
    error: ''
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const res = await handoverService.getHandovers({ myOnly: filterMy });
      if (res.success && res.data) {
        setHandovers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, [filterMy]);

  const handleOpenCreateModal = async () => {
    try {
      const [docsRes, usersRes] = await Promise.all([
        documentService.getDocuments({ limit: 50 }),
        masterDataService.getUsers()
      ]);
      if (docsRes.success) setAvailableDocs(docsRes.data || []);
      if (usersRes.success) setUsersList(usersRes.data?.filter(u => u._id !== user?._id) || []);
      setShowModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (selectedDocIds.length === 0 || !targetCustodianId || !reason) return;

    try {
      setSubmitting(true);
      const res = await handoverService.createHandover({
        documentIds: selectedDocIds,
        newCustodianId: targetCustodianId,
        reason,
        remarks
      });
      if (res.success) {
        toast.success(`Custody transfer initiated: ${res.data?.handoverNumber || 'Submitted'}`);
        setShowModal(false);
        setSelectedDocIds([]);
        setTargetCustodianId('');
        setReason('');
        setRemarks('');
        fetchHandovers();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate handover';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenActionModal = (handover, type) => {
    setActionModal({
      isOpen: true,
      handover,
      type,
      remarks: type === 'accept' ? 'Physical custody and binder condition verified in accordance with QA standards.' : '',
      acknowledged: false,
      error: ''
    });
  };

  const handleCloseActionModal = () => {
    setActionModal({
      isOpen: false,
      handover: null,
      type: 'accept',
      remarks: '',
      acknowledged: false,
      error: ''
    });
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.handover) return;

    if (actionModal.type === 'accept' && !actionModal.acknowledged) {
      setActionModal(prev => ({ ...prev, error: 'You must confirm the 21 CFR Part 11 custody transfer declaration.' }));
      return;
    }

    if (actionModal.type === 'reject' && !actionModal.remarks.trim()) {
      setActionModal(prev => ({ ...prev, error: 'Regulatory justification is required for rejecting custody.' }));
      return;
    }

    try {
      setActionSubmitting(true);
      if (actionModal.type === 'accept') {
        const res = await handoverService.acceptHandover(actionModal.handover._id, actionModal.remarks);
        if (res.success) {
          toast.success(`Custody of ${actionModal.handover.handoverNumber} successfully accepted under 21 CFR Part 11.`);
          handleCloseActionModal();
          fetchHandovers();
        }
      } else {
        const res = await handoverService.rejectHandover(actionModal.handover._id, actionModal.remarks.trim());
        if (res.success) {
          toast.warning(`Custody handover ${actionModal.handover.handoverNumber} rejected.`);
          handleCloseActionModal();
          fetchHandovers();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Custody action failed';
      setActionModal(prev => ({ ...prev, error: msg }));
      toast.error(msg);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chain of Custody & Handovers</h1>
          <p className="text-xs text-slate-500">
            Regulated two-party transfer of physical accountability for pharmaceutical binders and archives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMy(!filterMy)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              filterMy ? 'bg-orange-50 border-orange-500 text-orange-800' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            {filterMy ? 'Showing My Handovers' : 'Show All Handovers'}
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Initiate Custody Transfer
          </button>
        </div>
      </div>

      {/* Handovers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">Handover #</th>
                <th className="py-3 px-4">Documents</th>
                <th className="py-3 px-3">Relinquishing Custodian</th>
                <th className="py-3 px-3">Receiving Custodian</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">Loading handovers...</td>
                </tr>
              ) : handovers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">No custody handover transactions recorded.</td>
                </tr>
              ) : (
                handovers.map((h) => {
                  const myId = String(user?._id || user?.id || '');
                  const recipientId = String(h.newCustodian?._id || h.newCustodian || '');
                  const isRecipient = recipientId === myId;
                  const isAdmin = user?.role === 'Admin';
                  const isQA = user?.role === 'QA' || user?.role === 'QA Manager';
                  const canAct = h.status === 'Pending Acceptance' && (isRecipient || isAdmin || isQA);
                  return (
                    <tr key={h._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-orange-700 whitespace-nowrap">{h.handoverNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {h.documents?.map(d => d.documentNumber).join(', ') || '1 Record'}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{h.previousCustodian?.name}</td>
                      <td className="py-3 px-3 font-semibold text-orange-800">{h.newCustodian?.name}</td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-xs">{h.reason}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          h.status === 'Accepted'
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : h.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {canAct ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenActionModal(h, 'accept')}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Accept Custody
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(h, 'reject')}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {h.status === 'Accepted' ? 'Completed' : 'Awaiting Sign'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Initiate Custody Transfer */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Initiate Custody Handover</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Documents for Transfer *</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {availableDocs.map((doc) => (
                    <label key={doc._id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDocIds([...selectedDocIds, doc._id]);
                          else setSelectedDocIds(selectedDocIds.filter(id => id !== doc._id));
                        }}
                        className="rounded text-orange-600 border-slate-300"
                      />
                      <span className="font-mono font-bold text-orange-800">{doc.documentNumber}</span>
                      <span className="text-slate-700 truncate">{doc.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designate Receiving Custodian *</label>
                <select
                  required
                  value={targetCustodianId}
                  onChange={(e) => setTargetCustodianId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Select Recipient Personnel --</option>
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role} - {u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regulatory Transfer Reason *</label>
                <textarea
                  required
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Reassigned to Production Lead for annual batch auditing"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedDocIds.length === 0 || !targetCustodianId}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Initiating...' : 'Submit Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: 21 CFR Part 11 Accept / Reject Custody Transfer */}
      {actionModal.isOpen && actionModal.handover && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
                  actionModal.type === 'accept' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {actionModal.type === 'accept' ? (
                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {actionModal.type === 'accept'
                      ? 'Accept Custody Transfer (21 CFR Part 11)'
                      : 'Reject Custody Transfer'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {actionModal.type === 'accept'
                      ? 'Confirm physical receipt & accountability for pharmaceutical documents'
                      : 'Provide regulatory non-acceptance justification for audit trail'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseActionModal}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Handover Details Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Handover Number:</span>
                <span className="font-mono font-bold text-orange-700">{actionModal.handover.handoverNumber}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 shrink-0">Documents:</span>
                <span className="font-medium text-slate-800 text-right">
                  {actionModal.handover.documents?.map(d => d.documentNumber).join(', ') || '1 Document Record'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Relinquishing Custodian:</span>
                <span className="font-medium text-slate-800">{actionModal.handover.previousCustodian?.name || 'Authorized Staff'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Receiving Custodian:</span>
                <span className="font-semibold text-orange-800">{actionModal.handover.newCustodian?.name || user?.name}</span>
              </div>
              {actionModal.handover.reason && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Reason:</span>
                  <span className="text-slate-700 italic max-w-xs truncate">{actionModal.handover.reason}</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {actionModal.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionModal.error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              {actionModal.type === 'accept' ? (
                <>
                  <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                    <p className="text-[11px] text-orange-950 font-medium leading-relaxed">
                      "I hereby acknowledge receipt and assume formal physical custody and regulatory accountability for the listed document(s) in compliance with GxP procedures and 21 CFR Part 11 requirements."
                    </p>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={actionModal.acknowledged}
                        onChange={(e) => setActionModal(prev => ({ ...prev, acknowledged: e.target.checked, error: '' }))}
                        className="mt-0.5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-orange-900">
                        I confirm physical receipt of all listed documents in good condition *
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Acceptance Notes / Storage Location Remarks (Optional)
                    </label>
                    <textarea
                      rows="2"
                      value={actionModal.remarks}
                      onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="e.g., Physical binder received, condition verified, placed in Plant-1 Room 102 archive."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                    ></textarea>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Regulatory Rejection Justification *
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={actionModal.remarks}
                    onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value, error: '' }))}
                    placeholder="Enter explicit reason for rejecting custody transfer (e.g., Missing binder pages, physical damage, incorrect receiving custodian, etc.)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                  ></textarea>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  disabled={actionSubmitting}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting || (actionModal.type === 'accept' && !actionModal.acknowledged)}
                  className={`px-4 py-1.5 text-white font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionModal.type === 'accept'
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-sm'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionSubmitting ? (
                    'Processing...'
                  ) : actionModal.type === 'accept' ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Accept Custody & Sign
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

