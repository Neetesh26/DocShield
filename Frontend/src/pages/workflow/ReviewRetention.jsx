import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Lock,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  FileCheck,
  FileSignature,
  Printer,
  X,
  Edit2,
  Calendar,
  LayoutList,
  Table as TableIcon,
  User as UserIcon,
  MapPin
} from 'lucide-react';
import { documentService, masterDataService } from '../../services';
import { toast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ReviewRetention = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = user?.role || '';

  // Strict 21 CFR Part 11 & GxP Role-Based Access Control (RBAC)
  // 1. Periodic Review: QA, Custodian, Document Controller, Admin
  const canPerformReview = ['Admin', 'QA Manager', 'QA', 'Document Controller', 'Custodian'].includes(userRole);
  // 2. Authorize Destruction: QA, Document Controller, Admin (Custodians and Viewers cannot authorize disposal)
  const canAuthorizeDestruction = ['Admin', 'QA Manager', 'QA', 'Document Controller'].includes(userRole);
  // 3. Legal Hold Management: QA, Document Controller, Admin
  const canManageLegalHold = ['Admin', 'QA Manager', 'QA', 'Document Controller'].includes(userRole);
  // 4. Retention Policy Configuration: QA, Admin only
  const canEditPolicy = ['Admin', 'QA Manager', 'QA'].includes(userRole);

  // Active Tab: 'review' | 'destruction' | 'log' | 'policy'
  const [activeTab, setActiveTab] = useState('review');

  // View Mode: 'table' (Clean Image-style Table) | 'list' (Executive List View)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('vidyagxp_review_view_mode') || 'table';
    } catch {
      return 'table';
    }
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('vidyagxp_review_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  // Data State
  const [documents, setDocuments] = useState([]);
  const [destructionLogs, setDestructionLogs] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');

  // Modals
  const [reviewModalDoc, setReviewModalDoc] = useState(null);
  const [reviewExtensionMonths, setReviewExtensionMonths] = useState(12);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [signatureMeaning, setSignatureMeaning] = useState('Reviewed');
  const [reviewPassword, setReviewPassword] = useState('');
  const [showReviewPassword, setShowReviewPassword] = useState(false);

  const openReviewModal = (doc) => {
    if (!canPerformReview) {
      toast.error(`Access Denied: Your active role '${userRole || 'Viewer'}' cannot sign periodic reviews. Requires QA, Custodian, or Document Controller.`);
      return;
    }
    setReviewModalDoc(doc);
    setReviewExtensionMonths(12);
    setSignatureMeaning('Reviewed');
    setReviewNotes('');
    setReviewPassword('');
    setShowReviewPassword(false);
  };

  const [destructionModalDoc, setDestructionModalDoc] = useState(null);
  const [destructionReason, setDestructionReason] = useState('Mandatory retention lifecycle elapsed per GxP schedule');
  const [destructionMethod, setDestructionMethod] = useState('Certified Cross-Cut Shredding & High-Temp Incineration');
  const [destructionWitness, setDestructionWitness] = useState('QA Compliance Manager');
  const [destructionPassword, setDestructionPassword] = useState('');
  const [submittingDestruction, setSubmittingDestruction] = useState(false);

  const [viewCertificateDoc, setViewCertificateDoc] = useState(null);

  const [editPolicyItem, setEditPolicyItem] = useState(null);
  const [policyRetentionYears, setPolicyRetentionYears] = useState(5);
  const [policyReviewMonths, setPolicyReviewMonths] = useState(12);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, logsRes, masterRes] = await Promise.all([
        documentService.getDocuments({ limit: 100 }),
        documentService.getDestructionLogs().catch(() => ({ success: true, data: [] })),
        masterDataService.getMasterData().catch(() => ({ success: true, data: {} }))
      ]);

      if (docsRes.success && docsRes.data) {
        setDocuments(docsRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setDestructionLogs(logsRes.data);
      }
      if (masterRes.success && masterRes.data?.documentTypes) {
        setDocumentTypes(masterRes.data.documentTypes);
      }
    } catch (err) {
      console.error('Failed to load review & retention records', err);
      toast.error('Could not load review schedules from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unscheduled';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Helper: Calculate Overdue or Due Soon Badge
  const getReviewDueInfo = (dateStr) => {
    if (!dateStr) {
      return { text: 'No Date', isOverdue: false, days: 0, pillClass: 'bg-slate-100 text-slate-500' };
    }
    const d = new Date(dateStr);
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `• ${Math.abs(diffDays)}d overdue`,
        isOverdue: true,
        days: diffDays,
        pillClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-medium'
      };
    } else if (diffDays <= 30) {
      return {
        text: `• in ${diffDays}d`,
        isOverdue: false,
        days: diffDays,
        pillClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-medium'
      };
    } else {
      return {
        text: `• in ${diffDays}d`,
        isOverdue: false,
        days: diffDays,
        pillClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-medium'
      };
    }
  };

  // Helper: Determine if document is due for destruction
  const isDocumentDueForDestruction = (doc) => {
    if (doc.retentionDestruction?.isDestroyed) return false;
    if (doc.status === 'Obsolete' || doc.status === 'Archived') return true;
    if (doc.effectiveDate) {
      const eff = new Date(doc.effectiveDate);
      const retentionYears = doc.retentionYears || 5;
      const expiry = new Date(eff);
      expiry.setFullYear(eff.getFullYear() + retentionYears);
      return expiry <= now;
    }
    return false;
  };

  // Filtered lists
  const periodicReviewDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.retentionDestruction?.isDestroyed) return false;
      if (doc.status === 'Obsolete') return false;

      // Search match
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        doc.documentNumber?.toLowerCase().includes(q) ||
        doc.title?.toLowerCase().includes(q) ||
        doc.currentCustodian?.name?.toLowerCase().includes(q) ||
        doc.department?.toLowerCase().includes(q);

      // Dept match
      const matchDept = selectedDept === 'All' || doc.department === selectedDept;

      // Overdue match
      const dueInfo = getReviewDueInfo(doc.reviewDate);
      const matchOverdue = !filterOverdueOnly || dueInfo.isOverdue;

      return matchSearch && matchDept && matchOverdue;
    });
  }, [documents, searchQuery, selectedDept, filterOverdueOnly]);

  const dueForDestructionDocs = useMemo(() => {
    return documents.filter((doc) => {
      const due = isDocumentDueForDestruction(doc);
      if (!due) return false;

      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        doc.documentNumber?.toLowerCase().includes(q) ||
        doc.title?.toLowerCase().includes(q) ||
        doc.currentCustodian?.name?.toLowerCase().includes(q);

      return matchSearch;
    });
  }, [documents, searchQuery]);

  // Statistics
  const overdueCount = useMemo(() => {
    return documents.filter((d) => {
      if (d.retentionDestruction?.isDestroyed || d.status === 'Obsolete') return false;
      return getReviewDueInfo(d.reviewDate).isOverdue;
    }).length;
  }, [documents]);

  const legalHoldCount = useMemo(() => {
    return documents.filter((d) => d.legalHold).length;
  }, [documents]);

  // Available departments
  const departments = useMemo(() => {
    const set = new Set();
    documents.forEach((d) => {
      if (d.department) set.add(d.department);
    });
    return Array.from(set).sort();
  }, [documents]);

  // Handler: Execute Periodic Review with 21 CFR Part 11 Electronic Signature
  const handleConfirmReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!reviewModalDoc) return;

    if (!reviewPassword || !reviewPassword.trim()) {
      toast.error('Security password is required for 21 CFR Part 11 electronic signature authentication.');
      return;
    }

    try {
      setSubmittingReview(true);
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + Number(reviewExtensionMonths));

      const res = await documentService.recordPeriodicReview(reviewModalDoc._id, {
        nextReviewDate: nextDate.toISOString(),
        renewalMonths: Number(reviewExtensionMonths),
        outcome: signatureMeaning,
        reviewOutcome: reviewNotes,
        signatureMeaning: signatureMeaning,
        remarks: reviewNotes,
        password: reviewPassword.trim()
      });

      if (res.success) {
        toast.success(`Periodic review for ${reviewModalDoc.documentNumber} electronically signed.`);
        setReviewModalDoc(null);
        setReviewNotes('');
        setReviewPassword('');
        setSignatureMeaning('Reviewed');
        fetchData();
      } else {
        toast.error(res.message || 'Review sign-off failed.');
      }
    } catch (err) {
      console.error('Error confirming review', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please enter your valid password (or demo123).';
      toast.error(errMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handler: Toggle Legal Hold
  const handleToggleLegalHold = async (doc) => {
    if (!canManageLegalHold) {
      toast.error(`Access Denied: Role '${userRole || 'Viewer'}' cannot manage regulatory legal holds. Requires QA or Document Controller.`);
      return;
    }
    const newState = !doc.legalHold;
    const confirmMsg = newState
      ? `Place active 21 CFR Part 11 Regulatory Legal Hold on ${doc.documentNumber}? (Destruction and alteration will be strictly prohibited).`
      : `Release Legal Hold for ${doc.documentNumber}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await documentService.updateMetadata(doc._id, { legalHold: newState });
      if (res.success) {
        toast.success(`Legal hold ${newState ? 'imposed' : 'released'} for ${doc.documentNumber}.`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update legal hold.');
    }
  };

  // Handler: Execute Destruction Sign-Off
  const handleConfirmDestruction = async () => {
    if (!destructionModalDoc) return;
    if (!canAuthorizeDestruction) {
      toast.error(`Access Denied: Role '${userRole || 'Viewer'}' cannot authorize document destruction. Requires QA or Document Controller.`);
      return;
    }
    if (destructionModalDoc.legalHold) {
      toast.error('Document is under active Legal Hold and cannot be destroyed.');
      return;
    }

    try {
      setSubmittingDestruction(true);
      const certNo = `COD-${destructionModalDoc.documentNumber.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

      const res = await documentService.authorizeDestruction(destructionModalDoc._id, {
        reason: destructionReason,
        method: destructionMethod,
        witness: destructionWitness,
        certificateNumber: certNo
      });

      if (res.success) {
        toast.success(`Document ${destructionModalDoc.documentNumber} permanently decommissioned. Certificate #${certNo} generated.`);
        setDestructionModalDoc(null);
        fetchData();
      } else {
        toast.error(res.message || 'Destruction authorization failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to authorize destruction.');
    } finally {
      setSubmittingDestruction(false);
    }
  };

  // Handler: Save Updated Retention Policy
  const handleSavePolicy = async () => {
    if (!editPolicyItem) return;
    if (!canEditPolicy) {
      toast.error(`Access Denied: Role '${userRole || 'Viewer'}' cannot update retention policy. Requires QA or Admin.`);
      return;
    }
    try {
      setSavingPolicy(true);
      const res = await masterDataService.updateDocumentType(editPolicyItem._id, {
        retentionYears: Number(policyRetentionYears),
        reviewIntervalMonths: Number(policyReviewMonths)
      });
      if (res.success) {
        toast.success(`Retention policy updated for ${editPolicyItem.name}.`);
        setEditPolicyItem(null);
        fetchData();
      } else {
        toast.error(res.message || 'Failed to update policy.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save retention policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Compliance Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Periodic Review & Retention Governance
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Periodic review reminders, retention policy per document type, legal hold and controlled destruction.
          </p>
        </div>

        {/* Global Quick Metrics & User Role RBAC Badge */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* User Active Role Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
            <ShieldCheck className={`w-3.5 h-3.5 ${canPerformReview ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-slate-500 dark:text-slate-400">Role:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{userRole || 'Viewer'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              canAuthorizeDestruction
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : canPerformReview
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              {canAuthorizeDestruction ? 'Full Authority' : canPerformReview ? 'Review Sign-off' : 'Read-Only'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">Overdue Reviews:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{overdueCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500 dark:text-slate-400">Due for Disposal:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{dueForDestructionDocs.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
            <Lock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span className="text-slate-500 dark:text-slate-400">Legal Holds:</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{legalHoldCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Exact layout & styling matching user image) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-3.5 font-semibold text-xs tracking-tight transition cursor-pointer relative whitespace-nowrap ${activeTab === 'review'
            ? 'text-teal-800 dark:text-teal-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          Due for periodic review ({periodicReviewDocs.length})
          {activeTab === 'review' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('destruction')}
          className={`pb-3 px-3.5 font-semibold text-xs tracking-tight transition cursor-pointer relative whitespace-nowrap ${activeTab === 'destruction'
            ? 'text-teal-800 dark:text-teal-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          Due for destruction ({dueForDestructionDocs.length})
          {activeTab === 'destruction' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`pb-3 px-3.5 font-semibold text-xs tracking-tight transition cursor-pointer relative whitespace-nowrap ${activeTab === 'log'
            ? 'text-teal-800 dark:text-teal-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          Destruction log ({destructionLogs.length})
          {activeTab === 'log' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policy')}
          className={`pb-3 px-3.5 font-semibold text-xs tracking-tight transition cursor-pointer relative whitespace-nowrap ${activeTab === 'policy'
            ? 'text-teal-800 dark:text-teal-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          Retention policy
          {activeTab === 'policy' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Filter bar for Review & Destruction tabs */}
        {(activeTab === 'review' || activeTab === 'destruction') && (
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by document number, title, custodian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-xs"
                />
              </div>

              {activeTab === 'review' && departments.length > 0 && (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-xs"
                >
                  <option value="All">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {activeTab === 'review' && (
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterOverdueOnly}
                    onChange={(e) => setFilterOverdueOnly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-700"
                  />
                  <span>Overdue only</span>
                </label>
              )}

              {/* View Mode Toggle: Table View vs List View */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleToggleViewMode('table')}
                  title="Table View (Image Style)"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleViewMode('list')}
                  title="Professional Card List View"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Refresh table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DUE FOR PERIODIC REVIEW                           */}
        {/* ======================================================== */}
        {activeTab === 'review' && (
          loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
              Loading periodic review schedules...
            </div>
          ) : periodicReviewDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/70" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                All scheduled documents are up to date.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No pending periodic reviews require immediate action.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW (EXACT IMAGE STYLE) */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-6">DOCUMENT</th>
                    <th className="py-3 px-4">CUSTODIAN</th>
                    <th className="py-3 px-4">REVIEW DATE</th>
                    <th className="py-3 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {periodicReviewDocs.map((doc) => {
                    const dueInfo = getReviewDueInfo(doc.reviewDate);
                    const custodianName =
                      doc.currentCustodian?.name ||
                      (typeof doc.currentCustodian === 'string' ? doc.currentCustodian : 'Unassigned');

                    return (
                      <tr
                        key={doc._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* DOCUMENT */}
                        <td className="py-4 px-6 max-w-md">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/documents/${doc._id}`)}
                              className="font-mono text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 hover:underline cursor-pointer flex items-center gap-1 tracking-tight"
                              title="Open document details"
                            >
                              <span>{doc.documentNumber}</span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                v{doc.version || '01'}
                              </span>
                            </button>
                            {doc.legalHold && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                <Lock className="w-2.5 h-2.5" /> Hold
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-slate-600 dark:text-slate-300 mt-1 leading-snug font-normal">
                            {doc.title}
                          </div>
                        </td>

                        {/* CUSTODIAN */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">
                              {custodianName}
                            </span>
                            {doc.department && (
                              <span className="text-[11px] text-slate-400">
                                {doc.department}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* REVIEW DATE & BADGE */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-slate-800 dark:text-slate-200 font-medium font-sans">
                              {formatDate(doc.reviewDate)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-mono inline-flex items-center gap-1 ${dueInfo.pillClass}`}
                            >
                              {dueInfo.text}
                            </span>
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {canPerformReview ? (
                            <button
                              type="button"
                              onClick={() => openReviewModal(doc)}
                              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                              Mark reviewed — no change
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                              title={`Periodic review sign-off restricted. Current role: '${userRole || 'Viewer'}'. Requires QA, Custodian, or Document Controller.`}
                            >
                              <Lock className="w-3 h-3 text-slate-400" /> Review Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* LIST VIEW (EXECUTIVE PROFESSIONAL CARDS) */
            <div className="p-4 space-y-3">
              {periodicReviewDocs.map((doc) => {
                const dueInfo = getReviewDueInfo(doc.reviewDate);
                const custodianName =
                  doc.currentCustodian?.name ||
                  (typeof doc.currentCustodian === 'string' ? doc.currentCustodian : 'Unassigned');

                return (
                  <div
                    key={doc._id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 md:p-5 shadow-xs hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5"
                  >
                    {/* Identification & Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          className="font-mono font-bold text-xs md:text-sm px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 hover:underline cursor-pointer"
                        >
                          {doc.documentNumber}
                        </button>

                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          v{doc.version || '01'}
                        </span>

                        {doc.documentType && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {doc.documentType}
                          </span>
                        )}

                        {doc.department && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            • {doc.department}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.legalHold && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            <Lock className="w-3 h-3" /> Legal Hold
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono inline-flex items-center gap-1 ${dueInfo.pillClass}`}>
                          {dueInfo.text}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="cursor-pointer" onClick={() => navigate(`/documents/${doc._id}`)}>
                      <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition leading-snug">
                        {doc.title}
                      </h3>
                      {(doc.product || doc.batchNumber) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {doc.product && <span>Product: <strong className="text-slate-700 dark:text-slate-300">{doc.product}</strong> • </span>}
                          {doc.batchNumber && <span>Batch: <strong className="font-mono text-slate-700 dark:text-slate-300">{doc.batchNumber}</strong></span>}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata & Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5" title="Designated Record Custodian">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Custodian: <strong className="text-slate-800 dark:text-slate-200">{custodianName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Next Review Due Date">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Review Due: <strong className="text-slate-800 dark:text-slate-200">{formatDate(doc.reviewDate)}</strong></span>
                        </div>
                        {doc.storageLocation?.code && (
                          <div className="flex items-center gap-1.5 font-mono" title="Physical Storage Location">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" />
                            <span>{doc.storageLocation.code}</span>
                          </div>
                        )}
                      </div>

                      {canPerformReview ? (
                        <button
                          type="button"
                          onClick={() => openReviewModal(doc)}
                          className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                          Mark reviewed — no change
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                          title={`Periodic review sign-off restricted. Current role: '${userRole || 'Viewer'}'. Requires QA, Custodian, or Document Controller.`}
                        >
                          <Lock className="w-3 h-3 text-slate-400" /> Review Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ======================================================== */}
        {/* TAB 2: DUE FOR DESTRUCTION                               */}
        {/* ======================================================== */}
        {activeTab === 'destruction' && (
          loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
              Auditing archive retention records...
            </div>
          ) : dueForDestructionDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-teal-600/70" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No documents currently due for disposal.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                All archived materials are within valid retention periods.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-6">DOCUMENT</th>
                    <th className="py-3 px-4">CUSTODIAN</th>
                    <th className="py-3 px-4">RETENTION LIFECYCLE</th>
                    <th className="py-3 px-4">LEGAL HOLD</th>
                    <th className="py-3 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dueForDestructionDocs.map((doc) => {
                    const custodianName =
                      doc.currentCustodian?.name ||
                      (typeof doc.currentCustodian === 'string' ? doc.currentCustodian : 'Unassigned');

                    return (
                      <tr
                        key={doc._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* DOCUMENT */}
                        <td className="py-4 px-6 max-w-md">
                          <button
                            type="button"
                            onClick={() => navigate(`/documents/${doc._id}`)}
                            className="font-mono text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 hover:underline cursor-pointer flex items-center gap-1 tracking-tight"
                          >
                            <span>{doc.documentNumber}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              v{doc.version || '01'}
                            </span>
                          </button>
                          <div className="text-[12px] text-slate-600 dark:text-slate-300 mt-1 leading-snug font-normal">
                            {doc.title}
                          </div>
                        </td>

                        {/* CUSTODIAN */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {custodianName}
                          </span>
                        </td>

                        {/* RETENTION */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {doc.retentionYears || 5} Years Retention
                            </span>
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                              • Retention expired
                            </span>
                          </div>
                        </td>

                        {/* LEGAL HOLD */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {canManageLegalHold ? (
                            <button
                              type="button"
                              onClick={() => handleToggleLegalHold(doc)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition ${doc.legalHold
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-400'
                                }`}
                              title="Click to toggle regulatory legal hold"
                            >
                              {doc.legalHold ? (
                                <>
                                  <Lock className="w-3 h-3 text-rose-600" /> Active Legal Hold
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Standard
                                </>
                              )}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-default select-none ${doc.legalHold
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                              title={`Legal hold modification restricted. Current role: '${userRole || 'Viewer'}'. Requires QA or Document Controller.`}
                            >
                              {doc.legalHold ? (
                                <>
                                  <Lock className="w-3 h-3 text-rose-600" /> Active Legal Hold
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-slate-400" /> Standard
                                </>
                              )}
                            </span>
                          )}
                        </td>

                        {/* ACTION */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {doc.legalHold ? (
                            <span
                              className="text-xs text-rose-500 dark:text-rose-400 font-medium italic cursor-not-allowed"
                              title="Destruction blocked under 21 CFR Part 11 active legal hold"
                            >
                              Destruction locked
                            </span>
                          ) : canAuthorizeDestruction ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDestructionModalDoc(doc);
                                setDestructionReason('Mandatory retention lifecycle elapsed per GxP schedule');
                                setDestructionMethod('Certified Cross-Cut Shredding & High-Temp Incineration');
                                setDestructionWitness('QA Compliance Manager');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Authorize Disposal
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                              title={`Destruction restricted. Current role: '${userRole || 'Viewer'}'. Requires QA or Document Controller.`}
                            >
                              <Lock className="w-3 h-3 text-slate-400" /> Disposal Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* LIST VIEW (CARDS) */
            <div className="p-4 space-y-3">
              {dueForDestructionDocs.map((doc) => {
                const custodianName =
                  doc.currentCustodian?.name ||
                  (typeof doc.currentCustodian === 'string' ? doc.currentCustodian : 'Unassigned');

                return (
                  <div
                    key={doc._id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 md:p-5 shadow-xs hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          className="font-mono font-bold text-xs md:text-sm px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 hover:underline cursor-pointer"
                        >
                          {doc.documentNumber}
                        </button>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          v{doc.version || '01'}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {doc.documentType || 'Archived Document'}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                          Retention Elapsed ({doc.retentionYears || 5}y)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canManageLegalHold ? (
                          <button
                            type="button"
                            onClick={() => handleToggleLegalHold(doc)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition ${doc.legalHold
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-400'
                              }`}
                          >
                            {doc.legalHold ? (
                              <>
                                <Lock className="w-3 h-3 text-rose-600" /> Active Legal Hold
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Standard
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-default select-none ${doc.legalHold
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            title={`Legal hold modification restricted. Current role: '${userRole || 'Viewer'}'. Requires QA or Document Controller.`}
                          >
                            {doc.legalHold ? (
                              <>
                                <Lock className="w-3 h-3 text-rose-600" /> Active Legal Hold
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 text-slate-400" /> Standard
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="cursor-pointer" onClick={() => navigate(`/documents/${doc._id}`)}>
                      <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition leading-snug">
                        {doc.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Custodian: <strong className="text-slate-800 dark:text-slate-200">{custodianName}</strong></span>
                        </div>
                        {doc.effectiveDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Effective Since: <strong className="text-slate-800 dark:text-slate-200">{formatDate(doc.effectiveDate)}</strong></span>
                          </div>
                        )}
                      </div>

                      {doc.legalHold ? (
                        <span className="text-xs text-rose-500 font-medium italic">
                          Destruction locked under legal hold
                        </span>
                      ) : canAuthorizeDestruction ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDestructionModalDoc(doc);
                            setDestructionReason('Mandatory retention lifecycle elapsed per GxP schedule');
                            setDestructionMethod('Certified Cross-Cut Shredding & High-Temp Incineration');
                            setDestructionWitness('QA Compliance Manager');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Authorize Disposal
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                          title={`Destruction restricted. Current role: '${userRole || 'Viewer'}'. Requires QA or Document Controller.`}
                        >
                          <Lock className="w-3 h-3 text-slate-400" /> Disposal Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ======================================================== */}
        {/* TAB 3: DESTRUCTION LOG                                   */}
        {/* ======================================================== */}
        {activeTab === 'log' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-6">DOCUMENT & TITLE</th>
                  <th className="py-3 px-4">DESTRUCTION DATE</th>
                  <th className="py-3 px-4">METHOD</th>
                  <th className="py-3 px-4">AUTHORIZED BY & WITNESS</th>
                  <th className="py-3 px-4">CERTIFICATE #</th>
                  <th className="py-3 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {destructionLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <FileSignature className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No destruction records logged yet.
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Authorized disposals and Certificate of Destruction records will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  destructionLogs.map((item) => {
                    const info = item.retentionDestruction || {};
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-6 max-w-xs">
                          <button
                            type="button"
                            onClick={() => navigate(`/documents/${item._id}`)}
                            className="font-mono text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400 cursor-pointer"
                          >
                            {item.documentNumber}
                          </button>
                          <div className="text-[12px] text-slate-600 dark:text-slate-300 truncate">
                            {item.title}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {info.destroyedAt ? formatDate(info.destroyedAt) : formatDate(item.updatedAt)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {info.method || 'Certified Shredding'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {info.destroyedBy || 'QA Officer'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Witness: {info.witness || 'QA Witness'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {info.certificateNumber || `COD-${item._id.slice(-6)}`}
                        </td>

                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewCertificateDoc(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Certificate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RETENTION POLICY                                  */}
        {/* ======================================================== */}
        {activeTab === 'policy' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-6">DOCUMENT TYPE & NAME</th>
                  <th className="py-3 px-4">PREFIX</th>
                  <th className="py-3 px-4">RETENTION MANDATE</th>
                  <th className="py-3 px-4">REVIEW CYCLE</th>
                  <th className="py-3 px-4">REGULATORY GOVERNANCE</th>
                  <th className="py-3 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documentTypes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      Loading Master Retention Policy matrix...
                    </td>
                  </tr>
                ) : (
                  documentTypes.map((type) => (
                    <tr
                      key={type._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {type.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {type.code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                        {type.prefix}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {type.retentionYears || 5} Years
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Post batch expiry / obsolescence
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Every {type.reviewIntervalMonths || 12} Months
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Scheduled periodic validation
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {type.code === 'BMR' || type.code === 'BPR'
                            ? '21 CFR 211.180(a)'
                            : type.code === 'SOP'
                              ? '21 CFR 211.100'
                              : 'GxP Annex 11'}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        {canEditPolicy ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditPolicyItem(type);
                              setPolicyRetentionYears(type.retentionYears || 5);
                              setPolicyReviewMonths(type.reviewIntervalMonths || 12);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600 text-xs font-semibold transition cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Policy
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                            title={`Policy editing restricted to QA and Admin. Current role: '${userRole || 'Viewer'}'`}
                          >
                            <Lock className="w-2.5 h-2.5 text-slate-400" /> QA Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: PERIODIC REVIEW 21 CFR PART 11 ELECTRONIC SIGNATURE */}
      {/* ======================================================== */}

      {reviewModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop-blur animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-3 animate-modal-pop">

          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Periodic Review Completed
            </h2>

            <button
              type="button"
              onClick={() => setReviewModalDoc(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Access Restriction Warning if applicable */}
          {!canPerformReview && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <strong>Role Access Restricted:</strong> Your role ({userRole || 'Viewer'}) is not authorized to sign periodic reviews. Requires QA, Custodian, or Document Controller.
            </div>
          )}

          {/* Document and Review Cycle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {reviewModalDoc.documentNumber} — Next review in{" "}
              <span className="text-orange-600 dark:text-orange-400 font-bold">
                {reviewExtensionMonths === 12
                  ? "1 year"
                  : reviewExtensionMonths === 24
                    ? "2 years"
                    : `${reviewExtensionMonths} months`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">
                Cycle:
              </span>

              {[
                { label: "1 yr", val: 12 },
                { label: "2 yrs", val: 24 },
                { label: "6 mo", val: 6 }
              ].map((cycle) => (
                <button
                  key={cycle.val}
                  type="button"
                  onClick={() => setReviewExtensionMonths(cycle.val)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${reviewExtensionMonths === cycle.val
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                  {cycle.label}
                </button>
              ))}
            </div>
          </div>

          {/* Electronic Signature Notice */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
              <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
              <span>21 CFR Part 11 Electronic Signature</span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              By signing, you confirm this action is attributable to you and legally equivalent to your handwritten signature.
            </p>
          </div>

          {/* Review Form */}
          <form onSubmit={handleConfirmReview} className="space-y-3">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Signer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Signer
                </label>

                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    user
                      ? `${user.name} — ${userRole || 'Signer'} (${user.employeeId || user.username || user.email || "U1"})`
                      : "Authorized Signer"
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-not-allowed"
                />
              </div>

              {/* Signature Meaning */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meaning of Signature
                </label>

                <select
                  value={signatureMeaning}
                  onChange={(e) => setSignatureMeaning(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                  <option value="Verified — No Changes Required">
                    Verified — No Changes Required
                  </option>
                  <option value="Author / Reviewer Sign-off">
                    Author / Reviewer Sign-off
                  </option>
                </select>
              </div>
            </div>

            {/* Review Outcome */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Review Outcome
              </label>

              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter review findings or justification..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showReviewPassword ? "text" : "password"}
                  value={reviewPassword}
                  onChange={(e) => setReviewPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />

                <button
                  type="button"
                  onClick={() => setShowReviewPassword(!showReviewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showReviewPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showReviewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModalDoc(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canPerformReview || submittingReview || !reviewPassword}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {submittingReview ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-3.5 h-3.5" />
                    Sign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* MODAL: AUTHORIZE DESTRUCTION (DUAL SIGN-OFF)            */}
      {/* ======================================================== */}
      {destructionModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-blur animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-modal-pop">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Authorize Document Disposal
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    21 CFR Part 11 Dual Sign-Off Destruction Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDestructionModalDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
              <div className="font-mono font-bold text-rose-700 dark:text-rose-400">
                {destructionModalDoc.documentNumber}
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {destructionModalDoc.title}
              </div>
              <div className="text-[11px] text-slate-500">
                Retention Expiry: Completed • Current Status: Obsolete / Disposal Ready
              </div>
            </div>

            {/* Role restriction banner if user lacks destruction authorization */}
            {!canAuthorizeDestruction && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <strong>Authorization Restricted:</strong> Your role ({userRole || 'Viewer'}) is not authorized to decommission GxP records. Requires QA, Document Controller, or Admin.
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Authorizing Official */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Primary Authorizing Official
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${user?.name || 'Document Controller'} — ${userRole || 'Authorized Official'}`}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-medium text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Disposal Reason
                </label>
                <input
                  type="text"
                  value={destructionReason}
                  onChange={(e) => setDestructionReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Disposal Method
                </label>
                <select
                  value={destructionMethod}
                  onChange={(e) => setDestructionMethod(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs"
                >
                  <option value="Certified Cross-Cut Shredding & High-Temp Incineration">
                    Certified Cross-Cut Shredding & High-Temp Incineration (DIN 66399 Level P-4)
                  </option>
                  <option value="On-Site Chemical De-inking & Pulverization">
                    On-Site Chemical De-inking & Pulverization
                  </option>
                  <option value="Secure Digital Purge with Cryptographic Erasure">
                    Secure Digital Purge with Cryptographic Erasure (DoD 5220.22-M)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  QA Witness Signer (Mandatory Dual-Signoff)
                </label>
                <input
                  type="text"
                  value={destructionWitness}
                  onChange={(e) => setDestructionWitness(e.target.value)}
                  placeholder="Enter designated QA Compliance Witness name"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDestructionModalDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canAuthorizeDestruction || submittingDestruction}
                onClick={handleConfirmDestruction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submittingDestruction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authorizing...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" /> Confirm Dual Sign-Off & Destroy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CERTIFICATE OF DESTRUCTION VIEWER                 */}
      {/* ======================================================== */}
      {viewCertificateDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Official Certificate of Destruction
                  </h3>
                  <p className="text-xs text-slate-500">
                    GxP 21 CFR Part 11 Regulatory Compliance Document
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewCertificateDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 uppercase">Certificate ID:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                  {viewCertificateDoc.retentionDestruction?.certificateNumber || `COD-${viewCertificateDoc._id.slice(-6)}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Document Number</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {viewCertificateDoc.documentNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Version / Revision</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    v{viewCertificateDoc.version || '01'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">Document Title</span>
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-200 text-xs">
                    {viewCertificateDoc.title}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Destruction Timestamp</span>
                  <span className="font-sans text-slate-700 dark:text-slate-200 text-xs">
                    {formatDate(viewCertificateDoc.retentionDestruction?.destroyedAt || viewCertificateDoc.updatedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Authorized Operator</span>
                  <span className="font-sans text-slate-700 dark:text-slate-200 text-xs">
                    {viewCertificateDoc.retentionDestruction?.destroyedBy || 'Lead QA Controller'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">QA Witness</span>
                  <span className="font-sans text-slate-700 dark:text-slate-200 text-xs">
                    {viewCertificateDoc.retentionDestruction?.witness || 'QA Compliance Officer'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Disposal Method</span>
                  <span className="font-sans text-slate-700 dark:text-slate-200 text-xs">
                    {viewCertificateDoc.retentionDestruction?.method || 'Certified Cross-Cut Shredding'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-sans text-slate-500">
                <strong>Attestation:</strong> Certified that the physical copy and cryptographic copies of the above document have been decommissioned in full accordance with validated site Standard Operating Procedures.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setViewCertificateDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT RETENTION POLICY MATRIX                      */}
      {/* ======================================================== */}
      {editPolicyItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Update Policy: {editPolicyItem.name}
              </h3>
              <button
                onClick={() => setEditPolicyItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Retention Mandate (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={policyRetentionYears}
                  onChange={(e) => setPolicyRetentionYears(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Periodic Review Interval (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={policyReviewMonths}
                  onChange={(e) => setPolicyReviewMonths(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditPolicyItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPolicy}
                onClick={handleSavePolicy}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {savingPolicy ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
