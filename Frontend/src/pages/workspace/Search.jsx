import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, FileText, ArrowRight, X, ExternalLink } from 'lucide-react';
import { documentService } from '../../services';

export const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [product, setProduct] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);
      const res = await documentService.getDocuments({
        search: query,
        department,
        documentType,
        status,
        product,
        batchNumber,
        limit: 20
      });
      if (res.success && res.data) {
        setResults(res.data);
        setTotal(res.meta?.total || res.data.length);
      }
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('q')) {
      executeSearch();
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleReset = () => {
    setQuery('');
    setDepartment('');
    setDocumentType('');
    setStatus('');
    setProduct('');
    setBatchNumber('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Advanced GxP Document Search</h1>
        <p className="text-xs text-slate-500">
          Query indexed pharmaceutical procedures, batch manufacturing records, and validation files across physical vaults.
        </p>
      </div>

      {/* Advanced Search Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across Document Number, Title, Formulation, API, or Keywords..."
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
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
                <option value="Regulatory Affairs">Regulatory Affairs</option>
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
                <option value="Batch Packaging Record (BPR)">BPR</option>
                <option value="Validation Protocol / Report">Validation</option>
                <option value="Specification (SPEC)">Specification</option>
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product</label>
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Reset Filters
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <SearchIcon className="w-3.5 h-3.5" /> Execute Search
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Found <strong className="text-slate-800">{total}</strong> matched GxP documents</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Querying database indexes...
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No matching records located for the provided query and filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 shadow-xs hover:shadow-sm cursor-pointer transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-700 text-sm">{doc.documentNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{doc.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {doc.description || `GxP document governed under standard ${doc.department} procedures.`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Loc: {doc.storageLocation?.code || 'Central'}</span>
                    <span>Custodian: {doc.currentCustodian?.name || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

