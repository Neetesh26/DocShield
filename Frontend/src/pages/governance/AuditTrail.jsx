import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  History,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Table as TableIcon,
  LayoutList,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  Lock,
  FileText,
  CheckCircle
} from 'lucide-react';
import { auditService } from '../../services';

export const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('docushield_audit_view_mode') || 'table';
    } catch {
      return 'table';
    }
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('docushield_audit_view_mode', mode);
    } catch {
    }
  };

  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditTrailLogs({
        action,
        entity,
        user: userQuery,
        startDate,
        endDate,
        page,
        limit
      });
      if (res.success && res.data) {
        setLogs(res.data);
        if (res.meta) {
          setTotal(res.meta.total || 0);
          setTotalPages(res.meta.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, action, entity, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setAction('');
    setEntity('');
    setUserQuery('');
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
    setPage(1);
  };

  const hasActiveFilters = Boolean(action || entity || userQuery || startDate || endDate);

  const formatIST = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getActionBadgeClass = (act) => {
    switch (act) {
      case 'LOGIN':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 border-b-emerald-400 dark:border-b-emerald-700';
      case 'LOGOUT':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 border-b-slate-400 dark:border-b-slate-600';
      case 'UPLOAD':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 border-b-blue-400 dark:border-b-blue-700';
      case 'METADATA_EDIT':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 border-b-indigo-400 dark:border-b-indigo-700';
      case 'PERIODIC_REVIEW':
        return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 border-b-orange-400 dark:border-b-orange-700';
      case 'APPROVE':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 border-b-teal-400 dark:border-b-teal-700';
      case 'REJECT':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 border-b-rose-400 dark:border-b-rose-700';
      case 'DOCUMENT_DESTRUCTION':
        return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 border-b-red-400 dark:border-b-red-700';
      case 'CHECKOUT':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 border-b-amber-400 dark:border-b-amber-700';
      case 'RETURN':
        return 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 border-b-cyan-400 dark:border-b-cyan-700';
      case 'HANDOVER':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 border-b-sky-400 dark:border-b-sky-700';
      case 'PHYSICAL_AUDIT':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 border-b-purple-400 dark:border-b-purple-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 border-b-slate-300 dark:border-b-slate-600';
    }
  };

  const formatFieldLabel = (key) => {
    const customLabels = {
      documentNumber: 'Document Number',
      documentNo: 'Document Number',
      effectiveDate: 'Effective Date',
      reviewDate: 'Review Date',
      expiryDate: 'Expiry Date',
      preparedBy: 'Prepared By',
      reviewedBy: 'Reviewed By',
      approvedBy: 'Approved By',
      batchNumber: 'Batch Number',
      userEmail: 'User Email',
      userName: 'User Name',
      userRole: 'User Role',
      signerName: 'Signer Name',
      signatureMeaning: 'Signature Meaning',
      reason: 'Reason',
      status: 'Status',
      version: 'Version',
      title: 'Title',
      department: 'Department',
      retentionYears: 'Retention Years',
      securityClassification: 'Classification',
      rackNumber: 'Rack Number',
      boxNumber: 'Box Number',
      folderCode: 'Folder Code',
      alcoaScore: 'ALCOA+ Score',
      confidenceScore: 'Confidence',
      totalDocuments: 'Total Documents'
    };
    if (customLabels[key]) return customLabels[key];
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const renderFormattedDetail = (val, fallback = 'None / Initial Record') => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">{fallback}</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${val ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
          }`}>
          {val ? 'Active / True' : 'Inactive / False'}
        </span>
      );
    }
    if (typeof val === 'number') {
      return <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{val}</span>;
    }
    if (typeof val === 'string') {
      return <span className="text-xs font-medium text-slate-800 dark:text-slate-200 break-words">{val}</span>;
    }
    if (typeof val === 'object') {
      const entries = Object.entries(val);
      if (entries.length === 0) {
        return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">{fallback}</span>;
      }
      return (
        <div className="space-y-1 w-full">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="flex items-start justify-between gap-2 py-1 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px]"
            >
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {formatFieldLabel(k)}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right break-words max-w-[65%]">
                {typeof v === 'object' && v !== null
                  ? Array.isArray(v)
                    ? v.join(', ')
                    : Object.entries(v).map(([subK, subV]) => `${formatFieldLabel(subK)}: ${String(subV)}`).join(' | ')
                  : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-xs text-slate-800 dark:text-slate-200">{String(val)}</span>;
  };

  const renderValueCell = (val) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] italic">None / Initial</span>;
    }
    if (typeof val === 'string') {
      return (
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[150px] inline-block shadow-2xs" title={val}>
          {val}
        </span>
      );
    }
    if (typeof val === 'object') {
      const entries = Object.entries(val);
      if (entries.length === 0) return <span className="text-slate-400 font-mono text-[11px]">Empty</span>;
      return (
        <div className="space-y-0.5 max-w-[180px]">
          {entries.slice(0, 2).map(([k, v]) => (
            <div key={k} className="text-[10px] truncate text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatFieldLabel(k)}:</span>{' '}
              {typeof v === 'object' && v !== null ? Object.values(v).join(', ') : String(v)}
            </div>
          ))}
          {entries.length > 2 && (
            <span className="text-[9px] text-orange-600 dark:text-orange-400 font-semibold font-mono">+{entries.length - 2} more...</span>
          )}
        </div>
      );
    }
    return <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{String(val)}</span>;
  };

  const exportToCSV = () => {
    if (!logs.length) return;
    const headers = [
      'S_No',
      'When_Timestamp_IST',
      'Timestamp_ISO',
      'Who_Operator',
      'Role',
      'What_Action',
      'Target_Entity',
      'Entity_ID',
      'Previous_Value',
      'New_Value',
      'Why_Reason_For_Change',
      'Event_Details'
    ];
    const rows = logs.map((l, index) => [
      `"${total > 0 ? total - ((page - 1) * limit + index) : logs.length - index}"`,
      `"${formatIST(l.timestamp)}"`,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.userName || ''}"`,
      `"${l.userRole || ''}"`,
      `"${l.action || ''}"`,
      `"${l.entity || ''}"`,
      `"${l.entityId || ''}"`,
      `"${typeof l.previousValue === 'object' ? JSON.stringify(l.previousValue || '').replace(/"/g, '""') : (l.previousValue || '').toString().replace(/"/g, '""')}"`,
      `"${typeof l.newValue === 'object' ? JSON.stringify(l.newValue || '').replace(/"/g, '""') : (l.newValue || '').toString().replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_ALCOA_IST_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically sealed, append-only GxP compliance logs in Indian Standard Time (IST).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              title="3D Table View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              title="List View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            title="Refresh Logs"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={!logs.length}
            title="Export Audit Trail with S.No & IST Time"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)] space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by operator name..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
            />
          </div>

          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-auto px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium cursor-pointer shadow-2xs"
          >
            <option value="">All GxP Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="METADATA_EDIT">METADATA_EDIT</option>
            <option value="PERIODIC_REVIEW">PERIODIC_REVIEW</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="DOCUMENT_DESTRUCTION">DOCUMENT_DESTRUCTION</option>
            <option value="CHECKOUT">CHECKOUT</option>
            <option value="RETURN">RETURN</option>
            <option value="HANDOVER">HANDOVER</option>
            <option value="PHYSICAL_AUDIT">PHYSICAL_AUDIT</option>
          </select>

          <select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-auto px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium cursor-pointer shadow-2xs"
          >
            <option value="">All Entities</option>
            <option value="Document">Document</option>
            <option value="Authentication">Authentication</option>
            <option value="Approval">Approval</option>
            <option value="DocumentRequest">DocumentRequest</option>
            <option value="CheckoutRecord">CheckoutRecord</option>
            <option value="Handover">Handover</option>
            <option value="PhysicalAudit">PhysicalAudit</option>
          </select>

          <button
            type="button"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${showDateFilter || startDate || endDate
                ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Dates</span>
          </button>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer border border-transparent"
          >
            Filter Logs
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        {showDateFilter && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">From (IST):</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">To (IST):</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08),0_4px_12px_-4px_rgba(15,23,42,0.03)] dark:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading 21 CFR Part 11 audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No audit events found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or date filter options.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/70 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b-2 border-slate-200/90 dark:border-slate-700 sticky top-0 z-10 shadow-2xs">
                <tr className="text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3 text-center whitespace-nowrap w-14">S.No</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Time-IST</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Operator</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Previous Value</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">New Value</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Reason</th>
                  <th className="py-3 px-3 text-center ">Event Details</th>                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((log, index) => {
                  const serialNumber =
                    total > 0
                      ? total - ((page - 1) * limit + index)
                      : logs.length - index;
                  return (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedEntry(log)}
                      title="Click row to inspect full ALCOA+ audit trail record"
                      className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:via-white hover:to-orange-50/20 dark:hover:from-slate-800/80 dark:hover:via-slate-800/40 dark:hover:to-slate-800/80 transition-all duration-150 group cursor-pointer"
                    >
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:border-orange-300 dark:group-hover:border-orange-700 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:bg-orange-50/50 transition-colors">
                          {serialNumber}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-xs tracking-tight">
                            {formatIST(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div>
                            <span className="text-xs">{log.userName || 'System'}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {log.userRole || 'Automated'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-b-2 shadow-2xs inline-block ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                            {log.entity || 'General'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderValueCell(log.previousValue)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderValueCell(log.newValue)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px] block" title={log.reason || 'Standard operating procedure'}>
                          {log.reason || <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Standard Op</span>}
                        </span>
                      </td>

                      <td
                        className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-[200px] truncate"
                        title={log.details}
                      >
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-4 space-y-3">
            {logs.map((log, index) => {
              const serialNumber =
                total > 0
                  ? total - ((page - 1) * limit + index)
                  : logs.length - index;
              return (
                <div
                  key={log._id}
                  onClick={() => setSelectedEntry(log)}
                  title="Click card to inspect record"
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-850/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs">
                        #{serialNumber}
                      </span>

                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{log.userName || 'System Agent'}</span>
                          <span className="px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                            {log.userRole || 'Automated'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                          <span className="font-semibold">{formatIST(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border border-b-2 shadow-2xs ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>

                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {log.entity || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Previous Value</span>
                      <div className="mt-0.5">{renderValueCell(log.previousValue)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">New Value</span>
                      <div className="mt-0.5">{renderValueCell(log.newValue)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reason for Change</span>
                      <div className="text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5" title={log.reason}>
                        {log.reason || <span className="text-slate-400 italic text-[11px]">Standard Op</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {log.details}
                  </div>

                  {log.entityId && (
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>Target Entity ID:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{log.entityId}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/60">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{logs.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{total}</strong>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px]">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer focus:outline-none shadow-2xs font-medium"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer shadow-2xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 px-1 font-semibold">
                Page {page} of {totalPages || 1}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer shadow-2xs"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {selectedEntry && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-5 space-y-3.5 my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                    Audit Trail Record
                  </h3>
                  {/* <p className="text-[10px] text-slate-400 mt-0.5">
                    ALCOA+ 21 CFR Part 11 Event Details
                  </p> */}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Info: Who & What */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  1. Operator (Who)
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                  {selectedEntry.userName || 'System Agent'}
                </div>
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    Role: {selectedEntry.userRole || 'Automated'}
                  </span>
                  {selectedEntry.signature?.signerName && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> E-Signed
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  2. Action (What)
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getActionBadgeClass(selectedEntry.action)}`}>
                    {selectedEntry.action}
                  </span>
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                    {selectedEntry.entity}
                  </span>
                </div>
                {selectedEntry.entityId && (
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    Target: {selectedEntry.entityId}
                  </p>
                )}
              </div>
            </div>

            {/* Core Info: When & Why */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  3. Timestamp (When)
                </span>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                  <span className="truncate">{formatIST(selectedEntry.timestamp)}</span>
                  <span className="text-[9px] px-1 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold">IST</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  4. Reason / Justification
                </span>
                <div className="font-medium text-slate-800 dark:text-slate-200 text-xs line-clamp-2" title={selectedEntry.reason}>
                  {selectedEntry.reason || 'Standard validated GxP operation / Initial creation'}
                </div>
              </div>
            </div>

            {/* Value Changes: Previous vs New (Proper Formatted Data, Not Code) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Audit Trail Value Changes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                    Previous Value
                  </span>
                  <div className="max-h-32 overflow-y-auto">
                    {renderFormattedDetail(selectedEntry.previousValue, 'None / Initial Registration')}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/40 space-y-1">
                  <span className="text-[10px] font-bold text-orange-600/80 dark:text-orange-400/80 uppercase tracking-wide block">
                    New Value
                  </span>
                  <div className="max-h-32 overflow-y-auto">
                    {renderFormattedDetail(selectedEntry.newValue, 'Recorded / State Applied')}
                  </div>
                </div>
              </div>
            </div>

            {/* Electronic Signature Certificate (if present) */}
            {selectedEntry.signature?.signerName && (
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>21 CFR Part 11 Electronic Signature Certificate</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-0.5 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 font-medium">Signer: </span>
                    <span className="font-semibold">{selectedEntry.signature.signerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Meaning: </span>
                    <span className="font-semibold">{selectedEntry.signature.meaning || 'Author'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Narrative Summary */}
            <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Event Narrative
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {selectedEntry.details}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-1 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
