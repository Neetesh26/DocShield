import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  FileText,
  Eye,
  QrCode,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Plus,
  LayoutList,
  Table as TableIcon,
  User,
  Calendar,
  Box,
  FileCheck2,
  Tag,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { documentService } from '../../services';
import { toast } from '../../context/ToastContext';

export const Repository = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' (Professional List View) | 'table' (Data Table)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('vidyagxp_repo_view_mode') || 'list';
  });

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [physicalStatus, setPhysicalStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // QR Modal
  const [selectedQrDoc, setSelectedQrDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocuments({
        search,
        status,
        department,
        documentType,
        physicalStatus,
        page,
        limit,
        sortBy,
        sortOrder
      });

      if (res.success && res.data) {
        setDocuments(res.data);
        if (res.meta) {
          setTotalDocs(res.meta.total || 0);
          setTotalPages(res.meta.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load documents', err);
      toast.error('Failed to load repository documents from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, limit, status, department, documentType, physicalStatus, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatus('');
    setDepartment('');
    setDocumentType('');
    setPhysicalStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
    toast.info('All repository filters cleared.');
  };

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('vidyagxp_repo_view_mode', mode);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Effective':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Draft':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'In Review':
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800';
      case 'Pending Approval':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Superseded':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'Archived':
        return 'bg-slate-200 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getPhysicalStatusBadge = (pst) => {
    switch (pst) {
      case 'Stored':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Checked Out':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'In Transit':
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800';
      case 'Missing':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const hasActiveFilters = Boolean(search || status || department || documentType || physicalStatus);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              GxP Document Repository
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              {totalDocs} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Browse auto-classified folders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Button Group */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              title="Professional List View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              title="Compact Table View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Table View</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/workspace/upload')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchDocuments(); }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
          >
            Search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Effective">Effective</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="">All Departments</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Production">Production</option>
              <option value="Regulatory Affairs">Regulatory Affairs</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => { setDocumentType(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Standard Operating Procedure (SOP)">SOP</option>
              <option value="Batch Manufacturing Record (BMR)">BMR</option>
              <option value="Batch Packaging Record (BPR)">BPR</option>
              <option value="Validation Protocol / Report">Validation</option>
              <option value="Specification (SPEC)">Specification</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Physical Status</label>
            <select
              value={physicalStatus}
              onChange={(e) => { setPhysicalStatus(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="">All Physical States</option>
              <option value="Stored">Stored in Vault</option>
              <option value="Checked Out">Checked Out</option>
              <option value="In Transit">In Transit</option>
              <option value="Missing">Missing</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Sort Order</label>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="documentNumber:asc">Doc # (A-Z)</option>
              <option value="title:asc">Title (A-Z)</option>
              <option value="version:desc">Highest Version</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: LIST VIEW OR TABLE VIEW */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading GxP repository records...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching documents found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria, filters, or ingest a new document.</p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ========================================================
           EXECUTIVE PROFESSIONAL LIST VIEW
           ======================================================== */
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 md:p-5 shadow-xs hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5"
            >
              {/* Row 1: Identification & Status Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Document Number */}
                  <span className="font-mono font-bold text-xs md:text-sm px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80">
                    {doc.documentNumber}
                  </span>

                  {/* Version Pill */}
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    v{doc.version || '1.0'}
                  </span>

                  {/* Document Type Badge */}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[200px]">
                    {doc.documentType}
                  </span>

                  {/* Department */}
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    • {doc.department}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(doc.status)}`}>
                    {doc.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPhysicalStatusBadge(doc.physicalStatus)}`}>
                    {doc.physicalStatus}
                  </span>
                </div>
              </div>

              {/* Row 2: Document Title & Clinical Metadata */}
              <div className="cursor-pointer" onClick={() => navigate(`/documents/${doc._id}`)}>
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition leading-snug">
                  {doc.title}
                </h3>
                {(doc.product || doc.batchNumber || doc.description) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {doc.product && <span className="font-semibold text-slate-700 dark:text-slate-300">Product: {doc.product} • </span>}
                    {doc.batchNumber && <span className="font-mono text-slate-700 dark:text-slate-300">Batch: {doc.batchNumber} • </span>}
                    {doc.description}
                  </p>
                )}
              </div>

              {/* Row 3: Physical Custody, Storage, Dates & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                {/* Metadata Chips */}
                <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400 text-[11px]">
                  {/* Storage Location */}
                  <div className="flex items-center gap-1.5 font-mono" title="Physical Storage Location">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {doc.storageLocation?.code || 'Central Vault'}
                    </span>
                    {doc.boxNumber && <span className="text-slate-400">• Box {doc.boxNumber}</span>}
                  </div>

                  {/* Assigned Custodian */}
                  <div className="flex items-center gap-1.5" title="Designated Record Custodian">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Custodian: <strong className="text-slate-700 dark:text-slate-300">{doc.currentCustodian?.name || 'Unassigned'}</strong></span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5" title="Effective / Record Date">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.effectiveDate ? new Date(doc.effectiveDate).toLocaleDateString() : new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Digital PDF Indicator */}
                  {doc.fileUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <FileCheck2 className="w-3 h-3" />
                      PDF Verified
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedQrDoc(doc)}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="View & Print QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-orange-600" />
                    <span className="hidden sm:inline">QR Label</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <span>Open Dossier</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========================================================
           COMPACT DATA TABLE VIEW
           ======================================================== */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Doc #</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-3">Rev</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Physical State</th>
                  <th className="py-3 px-3">Custodian</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                      {doc.documentNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">v{doc.version || '1.0'}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{doc.documentType}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{doc.department}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPhysicalStatusBadge(doc.physicalStatus)}`}>
                        {doc.physicalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {doc.currentCustodian?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {doc.storageLocation?.code || 'Central'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQrDoc(doc)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View QR Label"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shadow-xs">
        <div className="flex items-center gap-2">
          <span>Showing <strong className="text-slate-800 dark:text-slate-200">{documents.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalDocs}</strong> records</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <span className="font-mono px-2 py-1 font-semibold text-slate-800 dark:text-slate-200">
            Page {page} of {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQrDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-white">Physical Binder Label QR</span>
              <button onClick={() => setSelectedQrDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            {selectedQrDoc.qrCodeImage ? (
              <img src={selectedQrDoc.qrCodeImage} alt="QR Code" className="w-48 h-48 mx-auto border border-slate-200 dark:border-slate-700 p-2.5 rounded-2xl bg-white" />
            ) : (
              <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-xs text-slate-400">QR code unavailable</div>
            )}
            <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div><strong className="text-slate-700 dark:text-slate-300">Doc #:</strong> <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{selectedQrDoc.documentNumber}</span></div>
              <div className="truncate"><strong className="text-slate-700 dark:text-slate-300">Title:</strong> {selectedQrDoc.title}</div>
              <div><strong className="text-slate-700 dark:text-slate-300">Location:</strong> <span className="font-mono">{selectedQrDoc.storageLocation?.code || 'Central Vault'}</span></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Binder Label
              </button>
              <button
                onClick={() => setSelectedQrDoc(null)}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
