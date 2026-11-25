import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, AlertTriangle, CheckCircle, Plus, CornerDownLeft, FileText } from 'lucide-react';
import { checkoutService, documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';

export const CheckoutRegister = () => {
  const { user } = useAuth();
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Return Inspection Modal
  const [returningItem, setReturningItem] = useState(null);
  const [conditionOnReturn, setConditionOnReturn] = useState('Good');
  const [returnRemarks, setReturnRemarks] = useState('');

  // New Checkout Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutPurpose, setCheckoutPurpose] = useState('');

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      const res = await checkoutService.getCheckouts({ status: filterStatus });
      if (res.success && res.data) {
        setCheckouts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [filterStatus]);

  const handleOpenCheckoutModal = async () => {
    try {
      const res = await documentService.getDocuments({ physicalStatus: 'Stored', limit: 50 });
      if (res.success) setAvailableDocs(res.data || []);
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setExpectedReturnDate(defaultDate);
      setShowCheckoutModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !expectedReturnDate || !checkoutPurpose) return;

    try {
      const res = await checkoutService.checkout({
        documentId: selectedDocId,
        expectedReturnDate,
        purpose: checkoutPurpose
      });
      if (res.success) {
        setShowCheckoutModal(false);
        setSelectedDocId('');
        setCheckoutPurpose('');
        fetchCheckouts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!returningItem) return;

    try {
      const res = await checkoutService.returnDocument(returningItem._id, conditionOnReturn, returnRemarks);
      if (res.success) {
        setReturningItem(null);
        setReturnRemarks('');
        fetchCheckouts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Return failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physical Check-Out Register</h1>
          <p className="text-xs text-slate-500">
            Physical issue / return of documents. Returns are verified by bin QR scan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Checkouts</option>
            <option value="Active">Active (Currently Borrowed)</option>
            <option value="Overdue">Overdue Items</option>
            <option value="Returned">Returned History</option>
          </select>
          <button
            onClick={handleOpenCheckoutModal}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Check Out Document
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">CHK #</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-3">Borrower</th>
                <th className="py-3 px-3">Purpose</th>
                <th className="py-3 px-3">Checkout Date</th>
                <th className="py-3 px-3">Expected Return</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">Loading check-out register...</td>
                </tr>
              ) : checkouts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">No checkout records found.</td>
                </tr>
              ) : (
                checkouts.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-orange-700 whitespace-nowrap">{item.checkoutNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-xs">
                      <div className="font-mono font-bold text-slate-800">{item.document?.documentNumber}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.document?.title}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">{item.user?.name}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[180px]">{item.purpose}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{new Date(item.checkoutDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className={item.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {new Date(item.expectedReturnDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === 'Returned'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : item.isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.isOverdue ? 'OVERDUE' : item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'Active' ? (
                        <button
                          onClick={() => setReturningItem(item)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 ml-auto"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" /> Return & Inspect
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Returned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Inspection Modal */}
      {returningItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Physical Return & Condition Inspection</h3>
              <button onClick={() => setReturningItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-lg space-y-1">
              <div><strong className="text-slate-700">Checkout #:</strong> <span className="font-mono">{returningItem.checkoutNumber}</span></div>
              <div><strong className="text-slate-700">Document:</strong> <span className="font-mono font-bold text-orange-700">{returningItem.document?.documentNumber}</span></div>
              <div><strong className="text-slate-700">Returned by:</strong> {returningItem.user?.name}</div>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Condition on Return *</label>
                <select
                  value={conditionOnReturn}
                  onChange={(e) => setConditionOnReturn(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Good">Good (Spine & Pages Intact)</option>
                  <option value="Intact">Intact</option>
                  <option value="Slight Wear">Slight Wear (Acceptable)</option>
                  <option value="Damaged">Damaged (Requires QA Investigation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection Verification Remarks</label>
                <textarea
                  rows="2"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Verified pages 1-24 present; returned to vault shelf."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturningItem(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                >
                  Verify Return into Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Check Out Document Binder</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCheckout} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Document *</label>
                <select
                  required
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Choose stored document --</option>
                  {availableDocs.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.documentNumber} - {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Return Date *</label>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Purpose *</label>
                <textarea
                  required
                  rows="2"
                  value={checkoutPurpose}
                  onChange={(e) => setCheckoutPurpose(e.target.value)}
                  placeholder="e.g. In-process packaging line verification in Cleanroom 3"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedDocId || !expectedReturnDate || !checkoutPurpose}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  Confirm Check Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

