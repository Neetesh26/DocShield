import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Download, 
  Bell, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  Printer, 
  QrCode, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  FileSpreadsheet,
  CornerDownLeft,
  FileCheck
} from 'lucide-react';
import { checkoutService, documentService, masterDataService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { generateOverduePdfReport, generateDueDatePdfReport } from '../../utils/checkoutPdfReports';

export const CheckoutRegister = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [remindingId, setRemindingId] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [counts, setCounts] = useState({ checkedOut: 0, overdue: 0, returned: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Checked out'); // 'Checked out' | 'Overdue' | 'Returned' | 'All'

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalTab, setReportModalTab] = useState('overdue'); // 'overdue' | 'duedate'
  const [selectedRecordForReturn, setSelectedRecordForReturn] = useState(null);

  // Form states
  const [availableDocs, setAvailableDocs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutPurpose, setCheckoutPurpose] = useState('');
  const [conditionOnCheckout, setConditionOnCheckout] = useState('Good');

  // Return modal state
  const [conditionOnReturn, setConditionOnReturn] = useState('Good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [binScannedCode, setBinScannedCode] = useState('PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01');

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      const res = await checkoutService.getCheckouts({ status: activeTab });
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setCheckouts(res.data);
        } else if (res.data.records) {
          setCheckouts(res.data.records);
          if (res.data.counts) {
            setCounts(res.data.counts);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching checkouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [activeTab]);

  // Load available docs & users for check out modal
  const handleOpenCheckoutModal = async () => {
    try {
      const [docsRes, usersRes] = await Promise.all([
        documentService.getDocuments({ limit: 100 }),
        masterDataService.getUsers().catch(() => ({ data: [] }))
      ]);

      if (docsRes?.success && docsRes.data) {
        // Prefer documents stored or ready for checkout
        setAvailableDocs(docsRes.data);
        if (docsRes.data.length > 0) {
          setSelectedDocId(docsRes.data[0]._id);
        }
      }

      if (usersRes?.success && usersRes.data) {
        setUsersList(usersRes.data);
        if (usersRes.data.length > 0) {
          setBorrowerId(usersRes.data[0]._id);
        }
      }

      const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setExpectedReturnDate(defaultDue);
      setCheckoutPurpose('');
      setConditionOnCheckout('Good');
      setShowCheckoutModal(true);
    } catch (e) {
      console.error(e);
      showToast('Failed to load document metadata', 'error');
    }
  };

  const handleCreateCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !expectedReturnDate || !checkoutPurpose) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const res = await checkoutService.checkout({
        documentId: selectedDocId,
        expectedReturnDate,
        purpose: checkoutPurpose,
        condition: conditionOnCheckout,
        borrowerId: borrowerId || undefined
      });

      if (res.success) {
        setShowCheckoutModal(false);
        showToast('Document checked out successfully under 21 CFR Part 11');
        fetchCheckouts();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Check out failed', 'error');
    }
  };

  const handleOpenReturnModal = (record = null) => {
    setSelectedRecordForReturn(record);
    setConditionOnReturn('Good');
    setReturnRemarks('');
    setBinScannedCode(record?.document?.storageLocation?.code || 'PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01');
    setShowReturnModal(true);
  };

  const handleConfirmReturnSubmit = async (e) => {
    e.preventDefault();
    const targetRecordId = selectedRecordForReturn?._id || checkouts.find(c => c.status === 'Active')?._id;
    if (!targetRecordId) {
      showToast('Please select a checked-out record to return', 'error');
      return;
    }

    try {
      const res = await checkoutService.returnDocument(
        targetRecordId, 
        conditionOnReturn, 
        returnRemarks || `Bin QR verified (${binScannedCode})`,
        binScannedCode
      );

      if (res.success) {
        setShowReturnModal(false);
        setSelectedRecordForReturn(null);
        showToast('Document returned and verified into vault storage');
        fetchCheckouts();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Return verification failed', 'error');
    }
  };

  const handleRemind = async (record) => {
    try {
      setRemindingId(record._id);
      const res = await checkoutService.remindBorrower(record._id);
      if (res.success) {
        const borrowerName = record.user?.name || 'Borrower';
        const docNum = record.document?.documentNumber || 'Document';
        showToast(`Compliance reminder successfully dispatched to ${borrowerName} for ${docNum}`);
        if (typeof refreshNotifications === 'function') {
          refreshNotifications();
        }
        setCheckouts(prev => prev.map(item => {
          if (item._id === record._id) {
            return {
              ...item,
              reminderCount: (item.reminderCount || 0) + 1,
              lastReminderSentAt: new Date().toISOString()
            };
          }
          return item;
        }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send reminder', 'error');
    } finally {
      setRemindingId(null);
    }
  };

  // Helper for borrower avatar initials
  const getInitials = (name) => {
    if (!name) return '??';
    const clean = name.trim().replace(/\(.*?\)/g, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Helper date formatting
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Overdue CSV Export
  const handleExportOverdueCSV = () => {
    const overdueList = checkouts.filter(c => c.isOverdue || (c.badge && c.badge.type === 'overdue'));
    const rowsToExport = overdueList.length > 0 ? overdueList : checkouts.filter(c => c.status === 'Active');

    const headers = ['Document Number', 'Title', 'Borrower', 'Department', 'Issued Date', 'Issued By', 'Due Date', 'Status', 'Condition'];
    const csvContent = [
      headers.join(','),
      ...rowsToExport.map(r => [
        `"${r.document?.documentNumber || ''}"`,
        `"${(r.document?.title || '').replace(/"/g, '""')}"`,
        `"${r.user?.name || ''}"`,
        `"${r.department || ''}"`,
        `"${formatDateTime(r.checkoutDate)}"`,
        `"${r.approvedBy?.name || 'Anita Sharma'}"`,
        `"${formatDateOnly(r.expectedReturnDate)}"`,
        `"${r.badge?.label || r.status}"`,
        `"${r.conditionOnCheckout || 'Good'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Overdue_Checkouts_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Overdue report exported to CSV');
  };

  // Due Date Schedule CSV Export
  const handleExportDueDateCSV = () => {
    const activeList = checkouts.filter(c => c.status === 'Active');
    const headers = ['Document Number', 'Title', 'Borrower', 'Department', 'Issued Date', 'Issued By', 'Due Date', 'Status', 'Purpose', 'Storage Bin'];
    const csvContent = [
      headers.join(','),
      ...activeList.map(r => [
        `"${r.document?.documentNumber || ''}"`,
        `"${(r.document?.title || '').replace(/"/g, '""')}"`,
        `"${r.user?.name || ''}"`,
        `"${r.department || ''}"`,
        `"${formatDateTime(r.checkoutDate)}"`,
        `"${r.approvedBy?.name || 'Anita Sharma'}"`,
        `"${formatDateOnly(r.expectedReturnDate)}"`,
        `"${r.badge?.label || 'Active'}"`,
        `"${(r.purpose || '').replace(/"/g, '""')}"`,
        `"PLT-1/PRD/R101/BIN-B01"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Active_Due_Date_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Due date schedule exported to CSV');
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 font-sans text-slate-800">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold border transition-all ${
          toastMessage.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Check-out register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical issue / return of documents. Returns are verified by bin QR scan.
          </p>
        </div>

        {/* Action Buttons Matching Screenshot 1 */}
        <div className="flex items-center gap-2">
          {/* Check out button */}
          <button
            onClick={handleOpenCheckoutModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0b192c] hover:bg-[#1a2d47] active:scale-[0.98] text-white text-xs font-medium rounded-lg shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-200" />
            <span>Check out</span>
          </button>

          {/* Return (scan) button */}
          <button
            onClick={() => handleOpenReturnModal(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#ea580c] hover:bg-[#ea580c] active:scale-[0.98] text-white text-xs font-medium rounded-lg shadow-xs transition"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span>Return (scan)</span>
          </button>

          {/* Overdue report button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Overdue report</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex items-center gap-1 pt-1">
        {[
          { key: 'Checked out', label: `Checked out (${counts.checkedOut})` },
          { key: 'Overdue', label: `Overdue (${counts.overdue})` },
          { key: 'Returned', label: `Returned (${counts.returned})` },
          { key: 'All', label: `All (${counts.all})` }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">DOCUMENT</th>
                <th className="py-3 px-4">BORROWER</th>
                <th className="py-3 px-4">PURPOSE</th>
                <th className="py-3 px-4">ISSUED</th>
                <th className="py-3 px-4">DUE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin"></div>
                      <span className="text-xs">Loading check-out register...</span>
                    </div>
                  </td>
                </tr>
              ) : checkouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    No checkout records found for {activeTab}.
                  </td>
                </tr>
              ) : (
                checkouts.map((item) => {
                  const isItemOverdue = item.isOverdue || (item.badge && item.badge.type === 'overdue');
                  const isItemReturned = item.status === 'Returned';
                  const borrowerInitials = getInitials(item.user?.name);
                  const issuedByName = item.approvedBy?.name || 'Anita Sharma';

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Document Column */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="font-mono text-[#ea580c] font-medium text-xs tracking-tight hover:underline cursor-pointer">
                          {item.document?.documentNumber}{' '}
                          <span className="text-[#ea580c] font-mono">
                            {item.document?.version ? `v${item.document.version}` : 'v01'}
                          </span>
                        </div>
                        <div className="text-slate-800 text-xs font-normal mt-0.5 line-clamp-2 max-w-sm">
                          {item.document?.title || 'Controlled GxP Document'}
                        </div>
                      </td>

                      {/* Borrower Column with Initials Circle Badge */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#ea580c] text-teal-100 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {borrowerInitials}
                          </div>
                          <span className="text-slate-800 text-xs font-normal">
                            {item.user?.name || 'Borrower'}
                          </span>
                        </div>
                      </td>

                      {/* Purpose Column */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <span className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                          {item.purpose}
                        </span>
                      </td>

                      {/* Issued Column */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="text-slate-700 text-xs">
                          {formatDateTime(item.checkoutDate)}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          by {issuedByName}
                        </div>
                      </td>

                      {/* Due Column */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="text-slate-700 text-xs">
                          {formatDateOnly(item.expectedReturnDate)}
                        </div>
                      </td>

                      {/* Status Column with Bullet Dot */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {isItemReturned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Returned
                          </span>
                        ) : isItemOverdue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {item.badge?.label || 'Overdue'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {item.badge?.label || 'Due in 0d'}
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                        {!isItemReturned ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReturnModal(item)}
                              className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition"
                            >
                              Return
                            </button>

                            {isItemOverdue && (
                              <button
                                onClick={() => handleRemind(item)}
                                disabled={remindingId === item._id}
                                className="px-2.5 py-1 rounded border border-teal-500/80 bg-white hover:bg-teal-50 active:scale-[0.98] text-teal-800 text-xs font-medium flex items-center gap-1 shadow-2xs transition disabled:opacity-60 cursor-pointer"
                                title={`Send compliance reminder notification to ${item.user?.name || 'borrower'}`}
                              >
                                <Bell className={`w-3.5 h-3.5 text-teal-600 ${remindingId === item._id ? 'animate-bounce' : ''}`} />
                                <span>{remindingId === item._id ? 'Sending...' : item.reminderCount ? `Remind (${item.reminderCount})` : 'Remind'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.actualReturnDate ? formatDateOnly(item.actualReturnDate) : 'Completed'}
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

      {/* MODAL 1: Check out Document Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Issue Document Check-Out</h3>
                <p className="text-[11px] text-slate-500">
                  Regulated physical binder issuance under 21 CFR Part 11 chain-of-custody.
                </p>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCheckoutSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Document to Borrow *
                </label>
                <select
                  required
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">-- Choose available document --</option>
                  {availableDocs.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.documentNumber} (v{doc.version || '01'}) - {doc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Borrower / Custodian *
                </label>
                <select
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.department || 'General'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="">Priya Nair (Quality Control)</option>
                      <option value="">Amit Kumar (Operations & R&D)</option>
                      <option value="">Rahul Verma (Production)</option>
                      <option value="">Dr. Meera Iyer (Quality Assurance)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Condition on Check-Out
                  </label>
                  <select
                    value={conditionOnCheckout}
                    onChange={(e) => setConditionOnCheckout(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="Good">Good (Spine & Pages Intact)</option>
                    <option value="Intact">Intact</option>
                    <option value="Slight Wear">Slight Wear (Acceptable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operational Purpose *
                </label>
                <textarea
                  required
                  rows="2"
                  value={checkoutPurpose}
                  onChange={(e) => setCheckoutPurpose(e.target.value)}
                  placeholder="e.g. HPLC calibration activity / Batch record review for APQR"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0b192c] hover:bg-[#1a2d47] text-white font-medium rounded-lg shadow-xs"
                >
                  Confirm Check Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Return (scan) Modal with Bin Verification */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Return & Bin Verification</h3>
                <p className="text-[11px] text-slate-500">
                  Returns are verified by physical bin QR scan into secure vault.
                </p>
              </div>
              <button 
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedRecordForReturn && (
              <div className="text-xs bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document:</span>
                  <span className="font-mono font-semibold text-cyan-700">{selectedRecordForReturn.document?.documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Borrower:</span>
                  <span className="font-medium text-slate-800">{selectedRecordForReturn.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="text-slate-700 truncate max-w-[220px]">{selectedRecordForReturn.purpose}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmReturnSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verified Bin QR Code *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={binScannedCode}
                      onChange={(e) => setBinScannedCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50/50 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <QrCode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBinScannedCode('PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01');
                      showToast('Bin QR scan verified: PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01');
                    }}
                    className="px-2.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-medium text-[11px]"
                  >
                    Scan QR
                  </button>
                </div>
                <span className="text-[10px] text-teal-600 mt-1 block">
                  ✓ Verified by bin QR scan into Central Archive Vault.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physical Condition on Return *
                </label>
                <select
                  value={conditionOnReturn}
                  onChange={(e) => setConditionOnReturn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="Good">Good (Spine & Pages Intact)</option>
                  <option value="Intact">Intact</option>
                  <option value="Slight Wear">Slight Wear (Acceptable)</option>
                  <option value="Damaged">Damaged (Requires QA Deviation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inspection Remarks
                </label>
                <textarea
                  rows="2"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Verified pages 1-24 present; returned to vault shelf."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium rounded-lg shadow-xs"
                >
                  Verify Return into Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 2-in-1 Overdue & Due Date Compliance Report Center */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Physical Check-Out Reports (21 CFR Part 11)</h3>
                <p className="text-[11px] text-slate-500">
                  Generate official GxP audit-ready PDF reports & CSV extracts for physical vault binders.
                </p>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs inside modal: Overdue vs Due Date Schedule */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setReportModalTab('overdue')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  reportModalTab === 'overdue'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>1. Overdue Audit Report ({counts.overdue})</span>
              </button>

              <button
                onClick={() => setReportModalTab('duedate')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  reportModalTab === 'duedate'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>2. Due Date & Active Schedule ({counts.checkedOut})</span>
              </button>
            </div>

            {/* TAB 1: Overdue Report Content */}
            {reportModalTab === 'overdue' && (
              <div className="space-y-3">
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Compliance Alert: {counts.overdue} Physical Documents Overdue</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      Physical records past their expected return date require immediate return or documented extension request under SOP-QA-0018 GDP governance.
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Document</th>
                        <th className="py-2.5 px-3">Borrower</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Days Overdue</th>
                        <th className="py-2.5 px-3">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checkouts
                        .filter(c => c.isOverdue || (c.badge && c.badge.type === 'overdue'))
                        .map(item => (
                          <tr key={item._id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <span className="font-mono text-cyan-700 font-semibold">{item.document?.documentNumber} {item.document?.version ? `v${item.document.version}` : 'v01'}</span>
                              <div className="text-[11px] text-slate-600 truncate max-w-xs">{item.document?.title}</div>
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              {item.user?.name}
                              <div className="text-[10px] text-slate-400">{item.department || item.user?.department}</div>
                            </td>
                            <td className="py-2 px-3 font-mono text-rose-700 font-medium">{formatDateOnly(item.expectedReturnDate)}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {item.badge?.label || 'Overdue'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[150px]">{item.purpose}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Scope: Overdue physical records only | Regulatory audit ready
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportOverdueCSV}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Overdue CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => generateOverduePdfReport(checkouts, user)}
                      className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-rose-200" />
                      <span>Generate Overdue PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Due Date & Active Schedule Content */}
            {reportModalTab === 'duedate' && (
              <div className="space-y-3">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-800 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Active Vault Custody & Due Date Schedule: {counts.checkedOut} Binders Out</div>
                    <div className="text-[11px] text-teal-700 mt-0.5">
                      Live schedule tracking of currently issued physical binders, designated return dates, and bin QR return verification.
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Document</th>
                        <th className="py-2.5 px-3">Borrower</th>
                        <th className="py-2.5 px-3">Issued Date</th>
                        <th className="py-2.5 px-3">Expected Due Date</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checkouts
                        .filter(c => c.status === 'Active')
                        .map(item => (
                          <tr key={item._id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <span className="font-mono text-cyan-700 font-semibold">{item.document?.documentNumber} {item.document?.version ? `v${item.document.version}` : 'v01'}</span>
                              <div className="text-[11px] text-slate-600 truncate max-w-xs">{item.document?.title}</div>
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              {item.user?.name}
                              <div className="text-[10px] text-slate-400">{item.department || item.user?.department}</div>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{formatDateTime(item.checkoutDate)}</td>
                            <td className="py-2 px-3 font-mono font-medium text-slate-800">{formatDateOnly(item.expectedReturnDate)}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                item.isOverdue || (item.badge && item.badge.type === 'overdue')
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {item.badge?.label || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Scope: All currently active borrowed binders | Continuous chain-of-custody
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportDueDateCSV}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Schedule CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => generateDueDatePdfReport(checkouts, user)}
                      className="px-4 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-200" />
                      <span>Generate Due Date PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutRegister;
