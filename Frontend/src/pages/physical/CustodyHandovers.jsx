import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, UserCheck, Clock, CheckCircle, XCircle, Plus, AlertCircle } from 'lucide-react';
import { handoverService, masterDataService, documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';

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
        setShowModal(false);
        setSelectedDocIds([]);
        setTargetCustodianId('');
        setReason('');
        fetchHandovers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate handover');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (id) => {
    if (!window.confirm('Accept custody of these documents under 21 CFR Part 11?')) return;
    try {
      const res = await handoverService.acceptHandover(id);
      if (res.success) fetchHandovers();
    } catch (err) {
      alert(err.response?.data?.message || 'Accept failed');
    }
  };

  const handleReject = async (id) => {
    const r = window.prompt('Provide rejection justification:');
    if (!r) return;
    try {
      const res = await handoverService.rejectHandover(id, r);
      if (res.success) fetchHandovers();
    } catch (err) {
      alert(err.response?.data?.message || 'Reject failed');
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
                  const canAct = h.status === 'Pending Acceptance' && String(h.newCustodian?._id) === String(user?._id);
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
                              onClick={() => handleAccept(h._id)}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                            >
                              Accept Custody
                            </button>
                            <button
                              onClick={() => handleReject(h._id)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold"
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
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Initiate Custody Handover</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
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
        </div>
      )}
    </div>
  );
};

