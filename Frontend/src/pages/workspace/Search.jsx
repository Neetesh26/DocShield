import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  FileText,
  ArrowRight,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Tag,
  QrCode,
  Building,
  RotateCw,
  Compass,
  Zap,
  Bookmark,
  ChevronRight,
  Flame,
  FileCheck2
} from 'lucide-react';
import { documentService } from '../../services';
import { Button3D } from '../../components/common/Button3D';

export const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search Mode: 'ai' (Default) vs 'standard'
  const [mode, setMode] = useState(searchParams.get('mode') === 'standard' ? 'standard' : 'ai');

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [product, setProduct] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  // AI Response State
  const [aiData, setAiData] = useState(null);
  const [results, setResults] = useState([]);
  const [suggestedDocs, setSuggestedDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Typeahead Auto-Suggest dropdown state
  const [showTypeahead, setShowTypeahead] = useState(false);
  const typeaheadRef = useRef(null);

  // Execute AI Search (Handles both query and empty query)
  const executeAiSearch = async (targetQuery = query) => {
    try {
      setShowTypeahead(false);
      setLoading(true);
      setHasSearched(true);
      const res = await documentService.aiSearch(targetQuery ? targetQuery.trim() : '');
      if (res.success && res.data) {
        setAiData(res.data);
        const docs = res.data.documents || (Array.isArray(res.data) ? res.data : []);
        setResults(docs);
        if (res.data.suggestedDocuments && res.data.suggestedDocuments.length > 0) {
          setSuggestedDocs(res.data.suggestedDocuments);
        }
        setTotal(res.data.total || docs.length);
      } else {
        // Fallback to standard listing if AI search returned no data
        const fallbackRes = await documentService.getDocuments({ limit: 30 });
        if (fallbackRes.success && fallbackRes.data) {
          setResults(fallbackRes.data);
          setTotal(fallbackRes.data.length);
        }
      }
    } catch (err) {
      console.error('AI search error, falling back to document repository', err);
      try {
        const fallbackRes = await documentService.getDocuments({ limit: 30 });
        if (fallbackRes.success && fallbackRes.data) {
          setResults(fallbackRes.data);
          setTotal(fallbackRes.data.length);
        }
      } catch (innerErr) {
        console.error('Failed to fetch fallback documents', innerErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load Initial Documents on Component Mount (Always displays documents directly from API)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const qParam = searchParams.get('q');
        const queryToUse = qParam ? qParam.trim() : '';
        if (queryToUse) {
          setQuery(queryToUse);
        }
        const res = await documentService.aiSearch(queryToUse);
        if (res.success && res.data) {
          setAiData(res.data);
          const docs = res.data.documents || (Array.isArray(res.data) ? res.data : []);
          setResults(docs);
          if (res.data.suggestedDocuments && res.data.suggestedDocuments.length > 0) {
            setSuggestedDocs(res.data.suggestedDocuments);
          }
          setTotal(res.data.total || docs.length);
        } else {
          const fallbackRes = await documentService.getDocuments({ limit: 30 });
          if (fallbackRes.success && fallbackRes.data) {
            setResults(fallbackRes.data);
            setTotal(fallbackRes.data.length);
          }
        }
      } catch (err) {
        console.error('Failed to load initial search documents, falling back to repository', err);
        try {
          const fallbackRes = await documentService.getDocuments({ limit: 30 });
          if (fallbackRes.success && fallbackRes.data) {
            setResults(fallbackRes.data);
            setTotal(fallbackRes.data.length);
          }
        } catch (innerErr) {
          console.error('Failed to fetch fallback documents', innerErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [searchParams]);

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

  const executeStandardSearch = async () => {
    try {
      setShowTypeahead(false);
      setLoading(true);
      setHasSearched(true);
      const res = await documentService.getDocuments({
        search: query,
        department,
        documentType,
        status,
        product,
        batchNumber,
        limit: 30
      });
      if (res.success && res.data) {
        setAiData(null);
        setResults(res.data);
        setTotal(res.meta?.total || res.data.length);
      }
    } catch (err) {
      console.error('Standard search error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (mode === 'ai') {
      executeAiSearch(query);
    } else {
      executeStandardSearch();
    }
  };

  const handlePromptClick = (promptItem) => {
    const promptQuery = typeof promptItem === 'string'
      ? promptItem
      : (promptItem?.query || promptItem?.label || '');
    setQuery(promptQuery);
    setMode('ai');
    executeAiSearch(promptQuery);
  };

  const handleCategoryClick = (catQuery) => {
    setQuery(catQuery);
    setMode('ai');
    executeAiSearch(catQuery);
  };

  const handleSelectSuggestedDoc = (doc) => {
    setQuery(doc.documentNumber);
    setShowTypeahead(false);
    executeAiSearch(doc.documentNumber);
  };

  const handleReset = () => {
    setQuery('');
    setDepartment('');
    setDocumentType('');
    setStatus('');
    setProduct('');
    setBatchNumber('');
    setShowTypeahead(false);
    executeAiSearch('');
  };

  // Comprehensive typeahead candidates from both results and suggestions
  const candidateDocs = [...results, ...suggestedDocs];
  const uniqueCandidateMap = new Map();
  candidateDocs.forEach(d => {
    if (d?._id && !uniqueCandidateMap.has(d._id)) {
      uniqueCandidateMap.set(d._id, d);
    }
  });
  const uniqueCandidates = Array.from(uniqueCandidateMap.values());

  const typeaheadMatches = query.trim().length >= 1
    ? uniqueCandidates.filter(d =>
        (d.documentNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.department || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.product || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.documentType || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Header with Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-orange-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Document Archive & Regulatory Repository Search
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-orange-400 border border-slate-800">
              <ShieldCheck className="w-3 h-3 text-orange-400" />
              Validated GxP Index
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Query pharmaceutical procedures, batch records, formulations, and physical vault coordinates across the repository.
          </p>
        </div>

        {/* Mode Toggle Switcher */}
        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'ai'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-orange-700'
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Intelligent Search</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('standard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'standard'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-orange-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Field Filters</span>
          </button>
        </div>
      </div>

      {/* Main Search Panel with Auto-Suggest Dropdown */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4 relative" ref={typeaheadRef}>
        <form onSubmit={handleSearch} className="space-y-4">
          
          {/* Main Search Bar with Live Typeahead Suggestions */}
          <div className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-orange-600 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-orange-600" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowTypeahead(true);
                }}
                onFocus={() => setShowTypeahead(true)}
                placeholder={
                  mode === 'ai'
                    ? "Search repository by document number, title, formulation, API, or department (e.g. 'HPLC SOP', 'Paracetamol BMR')..."
                    : "Search across Document Number, Title, Formulation, API, or Keywords..."
                }
                className="w-full pl-12 pr-32 py-3.5 text-sm bg-slate-50/50 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 font-medium text-slate-800 placeholder:text-slate-400 transition"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setShowTypeahead(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
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
                  <SearchIcon className="w-3.5 h-3.5 mr-1" />
                  <span>Search</span>
                </Button3D>
              </div>
            </div>

            {/* Live Autocomplete Typeahead Dropdown */}
            {showTypeahead && typeaheadMatches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-orange-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                <div className="p-2.5 bg-orange-50/60 border-b border-orange-100 flex items-center justify-between text-[11px] font-semibold text-orange-900">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                    Indexed Records Matching Query:
                  </span>
                  <span className="text-[10px] text-orange-600 font-mono">
                    {typeaheadMatches.length} Found
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {typeaheadMatches.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => handleSelectSuggestedDoc(doc)}
                      className="p-3 hover:bg-orange-50/80 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileCheck2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-orange-800">{doc.documentNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              v{doc.version}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 font-medium">
                              {doc.department}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium truncate mt-0.5">{doc.title}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real Dynamic Categories and Suggestions from Live API */}
          {mode === 'ai' && (
            <div className="space-y-3 pt-1">
              {/* Dynamic Category Filter Pills */}
              {((aiData?.availableCategories && aiData.availableCategories.length > 0) || results.length > 0) && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Live Categories:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border bg-orange-100 text-orange-800 border-orange-300"
                  >
                    All Types
                  </button>
                  {(aiData?.availableCategories || Array.from(new Set(results.map(d => d.documentType))).filter(Boolean).map(t => ({ label: t, query: t }))).map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCategoryClick(cat.query || cat.label)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-800 border-slate-200 hover:border-orange-300"
                    >
                      {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
                    </button>
                  ))}
                </div>
              )}

              {/* Dynamic Suggested Queries from Real Documents in Vault */}
              {(aiData?.suggestedQueries?.length > 0 || results.length > 0) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Frequently Referenced Records (1-Click Query):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiData?.suggestedQueries || results.slice(0, 6).map(d => ({ label: `${d.title.slice(0, 45)}...`, query: d.documentNumber, documentNumber: d.documentNumber }))).map((prompt, idx) => {
                      const label = typeof prompt === 'string' ? prompt : (prompt.label || prompt.query);
                      const docNum = typeof prompt === 'object' ? prompt.documentNumber : null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePromptClick(prompt)}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100/80 border border-orange-200/80 text-orange-900 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Zap className="w-3 h-3 text-orange-600 shrink-0" />
                          {docNum && (
                            <span className="font-mono font-bold text-orange-800 shrink-0">{docNum}:</span>
                          )}
                          <span className="truncate max-w-sm">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard Field Filters */}
          {mode === 'standard' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">All Departments</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Production">Production</option>
                  <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">All Document Types</option>
                  <option value="Standard Operating Procedure (SOP)">SOP</option>
                  <option value="Batch Manufacturing Record (BMR)">BMR</option>
                  <option value="Batch Production Record (BPR)">BPR</option>
                  <option value="Validation Protocol / Report">Validation</option>
                  <option value="Specification (SPEC)">Specification</option>
                  <option value="Logbook">Logbook</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Regulatory Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product / Active Substance</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BTH-2026"
                  className="w-full px-2.5 py-1.5 font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {mode === 'ai'
                ? 'Semantic AI search understands intent, equipment, chemical names, and vault locations.'
                : 'Exact filter search uses standard indexed parameters.'}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer transition"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Document Query Analysis & Synthesis Summary Box */}
      {aiData?.aiSummary && (
        <div className="bg-gradient-to-r from-orange-50 via-slate-50 to-white p-5 rounded-2xl border border-orange-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-orange-400 flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">Repository Query Analysis</h3>
                <span className="text-[10px] text-orange-700 font-medium">Record Relevance & Synthesis</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded border border-orange-200">
              {total} Record(s) Verified
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {aiData.aiSummary}
          </p>

          {/* Interpreted Entities Chips */}
          {aiData.interpreted && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-orange-100 text-[11px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Extracted Intent:</span>
              {aiData.interpreted.department && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold border border-orange-200">
                  Dept: {aiData.interpreted.department}
                </span>
              )}
              {aiData.interpreted.documentType && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  Type: {aiData.interpreted.documentType}
                </span>
              )}
              {aiData.interpreted.product && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Target: {aiData.interpreted.product}
                </span>
              )}
              {aiData.interpreted.location && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  Vault: {aiData.interpreted.location}
                </span>
              )}
              {aiData.interpreted.status && (
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 font-semibold border border-orange-200">
                  Status: {aiData.interpreted.status}
                </span>
              )}
            </div>
          )}

          {/* Follow-up suggestions */}
          {aiData.suggestedFollowUps && aiData.suggestedFollowUps.length > 0 && (
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested Actions:</span>
              <div className="flex flex-wrap gap-1.5">
                {aiData.suggestedFollowUps.map((action, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-white border border-orange-200 text-orange-700 text-[10px] font-medium"
                  >
                    • {action}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Displaying <strong className="text-slate-900 font-bold">{results.length}</strong> GxP documents
            {mode === 'ai' && ' ranked by repository relevance'}
          </span>
          {results.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-orange-700 hover:text-orange-800 font-semibold text-xs cursor-pointer"
            >
              Reset to All Documents
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-orange-100">
            <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-orange-800">Querying validated repository index...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-orange-200 text-slate-500 text-xs space-y-3">
            <SearchIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800">No matching records located for the provided query and filters.</p>
            <p className="text-slate-500">Try adjusting search terms, clearing filters, or browsing the master repository below.</p>
            <Button3D variant="primary" size="sm" onClick={handleReset}>
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              <span>View All Master Documents</span>
            </Button3D>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/documents/${doc._id}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-orange-400 shadow-xs hover:shadow-md cursor-pointer transition flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  {/* Top Row: Doc #, Confidence & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-orange-700 text-sm">{doc.documentNumber}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        v{doc.version}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        {doc.documentType || 'SOP'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Relevance Badge */}
                      {doc.aiConfidenceScore !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            doc.aiConfidenceScore >= 80
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-orange-600" />
                          {doc.aiConfidenceScore}% Relevance
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-700 transition line-clamp-1">
                    {doc.title}
                  </h3>

                  {/* Match Criteria Tags */}
                  {doc.aiMatchReasons && doc.aiMatchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {doc.aiMatchReasons.slice(0, 2).map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 text-[10px] font-medium border border-orange-100"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {doc.description || `GxP document governed under standard ${doc.department} procedures.`}
                  </p>
                </div>

                {/* Footer Meta */}
                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Building className="w-3 h-3 text-orange-600" />
                    {doc.storageLocation?.code || 'Central Vault'}
                  </span>
                  <span className="text-orange-700 font-semibold group-hover:underline flex items-center gap-0.5">
                    Open <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Documents Gallery (Always visible for fast exploration) */}
      {suggestedDocs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                <Bookmark className="w-4 h-4 text-orange-700" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Suggested GxP Documents & Controlled Records
                </h2>
                <p className="text-[11px] text-slate-500">
                  Recommended master procedures and high-frequency documents indexed in repository
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Repository <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedDocs.map((doc) => (
              <div
                key={doc._id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-orange-700 text-xs">{doc.documentNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      {doc.documentType || 'SOP'}
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="text-xs font-bold text-slate-900 group-hover:text-orange-700 transition cursor-pointer line-clamp-2"
                    title={doc.title}
                  >
                    {doc.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">Rev {doc.version}</span>
                    <span className="truncate">{doc.department}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestedDoc(doc)}
                    className="text-orange-700 hover:text-orange-800 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <SearchIcon className="w-3 h-3 text-orange-600" />
                    Search Related
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-0.5 cursor-pointer"
                  >
                    Inspect <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
