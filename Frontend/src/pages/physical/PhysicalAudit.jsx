import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, QrCode, AlertTriangle, CheckCircle, Plus, Eye, ShieldCheck } from 'lucide-react';
import { auditService, storageService } from '../../services';
import { useAuth } from '../../context/AuthContext';

export const PhysicalAudit = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Audit Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [auditTitle, setAuditTitle] = useState('');
  const [auditLocationId, setAuditLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  // Sign-off modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [findings, setFindings] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const res = await auditService.getPhysicalAudits();
      if (res.success && res.data) {
        setAudits(res.data);
        if (res.data.length > 0 && !selectedAudit) {
          handleInspectAudit(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleInspectAudit = async (id) => {
    try {
      const res = await auditService.getPhysicalAuditById(id);
      if (res.success) {
        setSelectedAudit(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenScheduleModal = async () => {
    try {
      const res = await storageService.getLocations();
      if (res.success) setLocations(res.data || []);
      setAuditTitle(`Physical Reconciliation Audit - ${new Date().toLocaleDateString()}`);
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setShowScheduleModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!auditTitle || !auditLocationId || !scheduledDate) return;

    try {
      const res = await auditService.createPhysicalAudit({
        title: auditTitle,
        storageLocationId: auditLocationId,
        scheduledDate,
        notes
      });
      if (res.success) {
        setShowScheduleModal(false);
        fetchAudits();
        if (res.data?._id) handleInspectAudit(res.data._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Schedule failed');
    }
  };

  const handleReconcileItem = async (itemId, status, qrVerified, condition) => {
    if (!selectedAudit) return;
    try {
      const res = await auditService.verifyItem(selectedAudit._id, {
        itemId,
        status,
        qrVerified,
        condition
      });
      if (res.success) {
        handleInspectAudit(selectedAudit._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizeAudit = async (e) => {
    e.preventDefault();
    if (!selectedAudit) return;

    try {
      const res = await auditService.completeAudit(selectedAudit._id, findings, correctiveActions);
      if (res.success) {
        setShowCompleteModal(false);
        fetchAudits();
        handleInspectAudit(selectedAudit._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Finalize failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physical Inventory Audit & Reconciliation</h1>
          <p className="text-xs text-slate-500">
            Vault inventory verification, expected vs actual record reconciliation, and QR verification.
          </p>
        </div>
        <button
          onClick={handleOpenScheduleModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" /> Schedule New Audit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Audits List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Audit Registry</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {audits.map((a) => {
              const isSelected = selectedAudit?._id === a._id;
              return (
                <div
                  key={a._id}
                  onClick={() => handleInspectAudit(a._id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                    isSelected ? 'border-orange-500 bg-orange-50/50 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-orange-800">{a.auditNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      a.status === 'Completed'
                        ? 'bg-orange-50 text-orange-800 border border-orange-200'
                        : a.status === 'Discrepancy Found'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 truncate mt-1">{a.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Target: {a.storageLocation?.code || 'Vault'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Active Audit Reconciliation Screen */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAudit ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-950 text-sm">{selectedAudit.auditNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {selectedAudit.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedAudit.title}</h2>
                  <p className="text-xs text-slate-500">
                    Vault: <strong className="font-mono text-slate-700">{selectedAudit.storageLocation?.code}</strong> • Auditor: {selectedAudit.auditor?.name}
                  </p>
                </div>

                {selectedAudit.status !== 'Completed' && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Finalize & Sign Audit
                  </button>
                )}
              </div>

              {/* Summary Reconciliation Counters */}
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expected Records</span>
                  <span className="text-lg font-bold text-slate-900">{selectedAudit.summary?.expectedCount || 0}</span>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <span className="text-orange-800 block text-[10px] uppercase font-semibold">Found & Confirmed</span>
                  <span className="text-lg font-bold text-orange-950">{selectedAudit.summary?.foundCount || 0}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-700 block text-[10px] uppercase font-semibold">Missing Records</span>
                  <span className="text-lg font-bold text-rose-800">{selectedAudit.summary?.missingCount || 0}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-700 block text-[10px] uppercase font-semibold">Misplaced / Flagged</span>
                  <span className="text-lg font-bold text-amber-800">{selectedAudit.summary?.misplacedCount || 0}</span>
                </div>
              </div>

              {/* Items Reconciliation Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Reconciliation Checklist
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                        <th className="pb-2">Expected Document</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">QR Verified</th>
                        <th className="pb-2">Condition</th>
                        <th className="pb-2 text-right">Quick Reconciliation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedAudit.items?.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50">
                          <td className="py-2.5">
                            <div className="font-mono font-bold text-orange-950">{item.document?.documentNumber}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.document?.title}</div>
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.status === 'Found' ? 'bg-orange-50 text-orange-800 border border-orange-200' : item.status === 'Missing' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono">
                            {item.qrVerified ? (
                              <span className="text-orange-600 flex items-center gap-1 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> Scanned
                              </span>
                            ) : (
                              <span className="text-slate-400">Unscanned</span>
                            )}
                          </td>
                          <td className="py-2.5 text-slate-700">{item.condition}</td>
                          <td className="py-2.5 text-right">
                            {selectedAudit.status !== 'Completed' && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleReconcileItem(item._id, 'Found', true, 'Good')}
                                  className="px-2 py-1 bg-orange-50 text-orange-800 hover:bg-orange-100 rounded text-[10px] font-semibold border border-orange-200 cursor-pointer"
                                >
                                  Mark Found (QR)
                                </button>
                                <button
                                  onClick={() => handleReconcileItem(item._id, 'Missing', false, 'Not Assessed')}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[10px] font-semibold border border-rose-200"
                                >
                                  Missing
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select an audit from the registry to inspect or conduct reconciliation.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Schedule Audit */}
      {showScheduleModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Schedule Inventory Audit</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Title *</label>
                <input
                  type="text"
                  required
                  value={auditTitle}
                  onChange={(e) => setAuditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Vault Location *</label>
                <select
                  required
                  value={auditLocationId}
                  onChange={(e) => setAuditLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                >
                  <option value="">-- Select Vault / Shelf --</option>
                  {locations.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.code} ({l.building} - {l.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                >
                  Confirm & Pull Records
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Finalize Audit Sign-off */}
      {showCompleteModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">21 CFR Part 11 Audit Sign-off</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleFinalizeAudit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Findings Summary</label>
                <textarea
                  rows="3"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Record summary of physical binder state, barcode scan success, and observations."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corrective Actions / CAPA (If any)</label>
                <textarea
                  rows="2"
                  value={correctiveActions}
                  onChange={(e) => setCorrectiveActions(e.target.value)}
                  placeholder="e.g. Relabel spine for SOP-QA-0042; investigate missing batch sheet."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                >
                  Sign & Finalize Audit Report
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

