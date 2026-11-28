import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Building,
  RotateCw,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  FileCheck2,
  LayoutList,
  Table as TableIcon,
  MapPin,
  User,
  Calendar,
  Printer,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Zap,
  Sparkles
} from 'lucide-react';
import { documentService } from '../../services';
import { Button3D } from '../../components/common/Button3D';

export const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search Criteria State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [physicalStatus, setPhysicalStatus] = useState('');
  const [product, setProduct] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  // Sorting and Pagination State
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Results State
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestedDocs, setSuggestedDocs] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [suggestedQueries, setSuggestedQueries] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('vidyagxp_search_view_mode') || 'list');
  const [selectedQrDoc, setSelectedQrDoc] = useState(null);

  const typeaheadRef = useRef(null);

  const handleToggleViewMode = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('vidyagxp_search_view_mode', newMode);
  };

  // Status Badge Styling Helper (GxP High-Contrast Compliance)
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

  // Centralized Data Fetcher
  const fetchSearchResults = useCallback(async (overrides = {}) => {
    try {
      setLoading(true);
      setShowTypeahead(false);

      const params = {
        search: query.trim(),
        department,
        documentType,
        status,
        physicalStatus,
        product: product.trim(),
        batchNumber: batchNumber.trim(),
        sortBy,
        sortOrder,
        page,
        limit,
        ...overrides
      };

      // Call API (Intelligent AI Search if query provided, else standard Master Catalog)
      let res;
      if (params.search) {
        res = await documentService.aiSearch(params.search, params);
      } else {
        res = await documentService.getDocuments(params);
      }

      if (res && res.success) {
        let docs = [];
        let count = 0;
        let totalP = 1;

        if (Array.isArray(res.data)) {
          docs = res.data;
          count = res.meta?.total ?? docs.length;
          totalP = res.meta?.totalPages ?? Math.ceil(count / params.limit) ?? 1;
        } else if (res.data?.documents) {
          docs = res.data.documents;
          count = res.data.total ?? docs.length;
          totalP = res.data.totalPages ?? Math.ceil(count / params.limit) ?? 1;
          if (res.data.suggestedDocuments) {
            setSuggestedDocs(res.data.suggestedDocuments);
          }
          if (res.data.availableCategories) {
            setAvailableCategories(res.data.availableCategories);
          }
          if (res.data.suggestedQueries) {
            setSuggestedQueries(res.data.suggestedQueries);
          }
          setAiSummary(res.data.aiSummary || null);
        }

        setResults(docs);
        setTotal(count);
        setTotalPages(Math.max(1, totalP));
      }
    } catch (err) {
      console.error('Failed to query document search index:', err);
    } finally {
      setLoading(false);
    }
  }, [query, department, documentType, status, physicalStatus, product, batchNumber, sortBy, sortOrder, page, limit]);

  // Initial Load & URL Search Param Synchronization
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && qParam.trim() !== query) {
      setQuery(qParam.trim());
      fetchSearchResults({ search: qParam.trim(), page: 1 });
    } else {
      fetchSearchResults();
    }
  }, []);

  // Fetch when page, limit, or sort changes
  useEffect(() => {
    fetchSearchResults();
  }, [page, limit, sortBy, sortOrder]);

  // Close typeahead dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target)) {
        setShowTypeahead(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Trigger Handlers
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchSearchResults({ page: 1 });
  };

  const handleQuickPromptClick = (promptItem) => {
    const qText = typeof promptItem === 'string'
      ? promptItem
      : (promptItem?.query || promptItem?.label || '');
    setQuery(qText);
    setPage(1);
    fetchSearchResults({ search: qText, page: 1 });
  };

  const handleCategoryFilter = (catType) => {
    setDocumentType(catType);
    setPage(1);
    fetchSearchResults({ documentType: catType, page: 1 });
  };

  const handleSelectSuggestedDoc = (doc) => {
    setQuery(doc.documentNumber);
    setShowTypeahead(false);
    setPage(1);
    fetchSearchResults({ search: doc.documentNumber, page: 1 });
  };

  const handleResetFilters = () => {
    setQuery('');
    setDepartment('');
    setDocumentType('');
    setStatus('');
    setPhysicalStatus('');
    setProduct('');
    setBatchNumber('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
    setShowTypeahead(false);
    fetchSearchResults({
      search: '',
      department: '',
      documentType: '',
      status: '',
      physicalStatus: '',
      product: '',
      batchNumber: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1
    });
  };

  // Active Filters Count
  const activeFiltersCount = [
    department,
    documentType,
    status,
    physicalStatus,
    product,
    batchNumber
  ].filter(Boolean).length;

  // Typeahead matching candidates
  const allCandidates = [...results, ...suggestedDocs];
  const uniqueCandidateMap = new Map();
  allCandidates.forEach(d => {
    if (d?._id && !uniqueCandidateMap.has(d._id)) {
      uniqueCandidateMap.set(d._id, d);
    }
  });
  const typeaheadMatches = query.trim().length >= 1
    ? Array.from(uniqueCandidateMap.values()).filter(d =>
        (d.documentNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.department || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.product || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.documentType || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-6">

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Advanced Document Search & Registry
            </h1>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              {total} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query regulated pharmaceutical standard procedures, batch records, formulations, and physical vault coordinates.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              title="Professional List View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              title="Compact Data Table"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 relative" ref={typeaheadRef}>
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          
          {/* Main Search Bar with Live Typeahead Suggestions */}
          <div className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-orange-600 dark:text-orange-400 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowTypeahead(true);
                }}
                onFocus={() => setShowTypeahead(true)}
                placeholder="Search repository "
                className="w-full pl-12 pr-32 py-3.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 dark:focus:border-orange-500 font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setShowTypeahead(false);
                      fetchSearchResults({ search: '', page: 1 });
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Button3D
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  <SearchIcon className="w-3.5 h-3.5 mr-1 inline" />
                  <span>Search</span>
                </Button3D>
              </div>
            </div>

            {/* Live Autocomplete Typeahead Dropdown */}
            {showTypeahead && typeaheadMatches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2.5 bg-orange-50/70 dark:bg-orange-950/40 border-b border-orange-100 dark:border-orange-900/60 flex items-center justify-between text-[11px] font-semibold text-orange-900 dark:text-orange-300">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    Indexed Records Matching Query:
                  </span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-bold">
                    {typeaheadMatches.length} Found
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {typeaheadMatches.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => handleSelectSuggestedDoc(doc)}
                      className="p-3 hover:bg-orange-50/80 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileCheck2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-orange-700 dark:text-orange-400">{doc.documentNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                              v{doc.version}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-medium">
                              {doc.department}
                            </span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-medium truncate mt-0.5">{doc.title}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Filter Categories Strip */}
          {((availableCategories && availableCategories.length > 0) || results.length > 0) && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Categories:
              </span>
              <button
                type="button"
                onClick={() => handleCategoryFilter('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
                  !documentType
                    ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                All Categories
              </button>
              {(availableCategories.length > 0 ? availableCategories : Array.from(new Set(results.map(d => d.documentType))).filter(Boolean).map(t => ({ label: t, query: t }))).map((cat, idx) => {
                const catLabel = cat.label || cat.query;
                const isSelected = documentType === catLabel;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCategoryFilter(catLabel)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {catLabel} {cat.count !== undefined ? `(${cat.count})` : ''}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Suggested 1-Click Search Chips */}
          {(suggestedQueries?.length > 0 || results.length > 0) && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Frequently Accessed Records (1-Click Query):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(suggestedQueries?.length > 0 ? suggestedQueries : results.slice(0, 6).map(d => ({ label: `${d.title.slice(0, 40)}...`, query: d.documentNumber, documentNumber: d.documentNumber }))).map((prompt, idx) => {
                  const label = typeof prompt === 'string' ? prompt : (prompt.label || prompt.query);
                  const docNum = typeof prompt === 'object' ? prompt.documentNumber : null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPromptClick(prompt)}
                      className="px-2.5 py-1 bg-orange-50/80 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 border border-orange-200 dark:border-slate-700 text-orange-900 dark:text-orange-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Zap className="w-3 h-3 text-orange-600 dark:text-orange-400 shrink-0" />
                      {docNum && (
                        <span className="font-mono font-bold text-orange-700 dark:text-orange-400 shrink-0">{docNum}:</span>
                      )}
                      <span className="truncate max-w-xs">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Advanced Filters Drawer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
              <span>{showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
                >
                  Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filter Inputs */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Production">Production</option>
                  <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                  <option value="Regulatory Affairs">Regulatory Affairs</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => { setDocumentType(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="Standard Operating Procedure (SOP)">SOP</option>
                  <option value="Batch Manufacturing Record (BMR)">BMR</option>
                  <option value="Batch Packaging Record (BPR)">BPR</option>
                  <option value="Validation Protocol / Report">Validation</option>
                  <option value="Specification (SPEC)">Specification</option>
                  <option value="Logbook">Logbook</option>
                  <option value="CAPA">CAPA</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Digital Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Effective">Effective</option>
                  <option value="Draft">Draft</option>
                  <option value="In Review">In Review</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Superseded">Superseded</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Physical Status</label>
                <select
                  value={physicalStatus}
                  onChange={(e) => { setPhysicalStatus(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">All States</option>
                  <option value="Stored">Stored in Vault</option>
                  <option value="Checked Out">Checked Out</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Drug / Product</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BTH-2026"
                  className="w-full px-2.5 py-1.5 font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Sorting & Results Count Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-bold">{results.length > 0 ? (page - 1) * limit + 1 : 0}</strong> -{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{Math.min(page * limit, total)}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{total}</strong> records
          </span>
          {query && (
            <span className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold">
              for "{query}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer font-medium"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="documentNumber:asc">Doc # (A-Z)</option>
              <option value="documentNumber:desc">Doc # (Z-A)</option>
              <option value="title:asc">Title (A-Z)</option>
              <option value="title:desc">Title (Z-A)</option>
              <option value="version:desc">Highest Version</option>
            </select>
          </div>

          {/* Items Per Page Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Results Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">Executing high-accuracy GxP search query...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-3">
            <SearchIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No matching records located for the provided query and filters.</p>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting search terms, clearing filters, or browsing the master repository below.</p>
            <Button3D variant="primary" size="sm" onClick={handleResetFilters}>
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              <span>Reset Search & Filters</span>
            </Button3D>
          </div>
        ) : viewMode === 'list' ? (
          /* ========================================================
             EXECUTIVE PROFESSIONAL LIST VIEW
             ======================================================== */
          <div className="space-y-3">
            {results.map((doc) => (
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
                      {doc.documentType || 'SOP'}
                    </span>

                    {/* Department */}
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      • {doc.department}
                    </span>
                  </div>

                  {/* Badges & Scores */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* AI Confidence / Relevance Badge */}
                    {doc.aiConfidenceScore !== undefined && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          doc.aiConfidenceScore >= 80
                            ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        }`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                        {doc.aiConfidenceScore}% Relevance
                      </span>
                    )}

                    {/* Digital Status */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(doc.status)}`}>
                      {doc.status}
                    </span>

                    {/* Physical Status */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPhysicalStatusBadge(doc.physicalStatus || 'Stored')}`}>
                      {doc.physicalStatus || 'Stored'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Document Title & Metadata */}
                <div className="cursor-pointer" onClick={() => navigate(`/documents/${doc._id}`)}>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition leading-snug">
                    {doc.title}
                  </h3>

                  {/* Match Criteria Tags */}
                  {doc.aiMatchReasons && doc.aiMatchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {doc.aiMatchReasons.slice(0, 3).map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-[10px] font-medium border border-orange-200 dark:border-orange-800/60"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description & Clinical Tags */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {doc.product && <span className="font-semibold text-slate-700 dark:text-slate-300">Product: {doc.product} • </span>}
                    {doc.batchNumber && <span className="font-mono text-slate-700 dark:text-slate-300">Batch: {doc.batchNumber} • </span>}
                    {doc.description || `GxP document governed under standard ${doc.department} procedures.`}
                  </p>
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
                      <span>{doc.effectiveDate ? new Date(doc.effectiveDate).toLocaleDateString() : (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A')}</span>
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
                  {results.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                        {doc.documentNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">v{doc.version || '1.0'}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{doc.documentType || 'SOP'}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{doc.department}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPhysicalStatusBadge(doc.physicalStatus || 'Stored')}`}>
                          {doc.physicalStatus || 'Stored'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        {doc.currentCustodian?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {doc.storageLocation?.code || 'Central Vault'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQrDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 rounded hover:bg-orange-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-orange-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/documents/${doc._id}`)}
                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          >
                            <span>View</span>
                            <Eye className="w-3 h-3" />
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
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Numeric Page Buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum;
              if (totalPages <= 5) {
                pNum = i + 1;
              } else if (page <= 3) {
                pNum = i + 1;
              } else if (page >= totalPages - 2) {
                pNum = totalPages - 4 + i;
              } else {
                pNum = page - 2 + i;
              }

              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer ${
                    page === pNum
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Suggested Documents Gallery */}
      {suggestedDocs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 flex items-center justify-center font-bold">
                <Bookmark className="w-4 h-4 text-orange-700 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Suggested GxP Documents & Controlled Records
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recommended master procedures and high-frequency documents indexed in repository
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Repository <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedDocs.map((doc) => (
              <div
                key={doc._id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-orange-700 dark:text-orange-400 text-xs">{doc.documentNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80">
                      {doc.documentType || 'SOP'}
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition cursor-pointer line-clamp-2"
                    title={doc.title}
                  >
                    {doc.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Rev {doc.version}</span>
                    <span className="truncate">{doc.department}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestedDoc(doc)}
                    className="text-orange-700 dark:text-orange-400 hover:text-orange-800 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <SearchIcon className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    Search Related
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] flex items-center gap-0.5 cursor-pointer"
                  >
                    Inspect <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrDoc && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fade-in my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
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
        </div>,
        document.body
      )}

    </div>
  );
};
