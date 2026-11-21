import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { requestService, documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';

export const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New Request Modal
  const [showModal, setShowModal] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [requestType, setRequestType] = useState('Print');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('Normal');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestService.getRequests({ type: typeFilter, status: statusFilter });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [typeFilter, statusFilter]);

  const handleOpenModal = async () => {
    try {
      const res = await documentService.getDocuments({ limit: 50 });
      if (res.success) setAvailableDocs(res.data || []);
      setShowModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !reason) return;

    try {
      const res = await requestService.createRequest({
        documentId: selectedDocId,
        requestType,
        reason,
        urgency
      });
      if (res.success) {
        setShowModal(false);
        setSelectedDocId('');
        setReason('');
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      const res = await requestService.cancelRequest(id);
      if (res.success) fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Document Operational Requests</h1>
          <p className="text-xs text-slate-500">
            Submit and govern controlled print copies, electronic downloads, and physical checkout requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Request Types</option>
            <option value="Print">Print</option>
            <option value="Download">Download</option>
            <option value="Checkout">Checkout</option>
            <option value="Controlled-Copy">Controlled-Copy</option>
          </select>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">Req #</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Requester</th>
                <th className="py-3 px-3">Urgency</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">No requests found.</td>
                </tr>
              ) : (
                requests.map((r) => {
                  const canCancel = r.status === 'Pending' && (String(r.requester?._id) === String(user?._id) || user?.role === 'Admin');
                  return (
                    <tr key={r._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700 whitespace-nowrap">{r.requestNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-xs">
                        <div className="font-mono font-bold text-slate-800">{r.document?.documentNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate">{r.document?.title}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{r.requestType}</td>
                      <td className="py-3 px-3 text-slate-700">{r.requester?.name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.urgency === 'Urgent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[200px]">{r.reason}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          r.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : r.status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelRequest(r._id)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-semibold"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">-</span>
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

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">New Document Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Document *</label>
                <select
                  required
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Select Document --</option>
                  {availableDocs.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.documentNumber} - {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Request Type *</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Print">Print Controlled Copy</option>
                  <option value="Download">Download Controlled PDF</option>
                  <option value="Checkout">Physical Binder Checkout</option>
                  <option value="Controlled-Copy">Controlled Official Issuance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GxP Justification Reason *</label>
                <textarea
                  required
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State clinical or manufacturing need..."
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
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

