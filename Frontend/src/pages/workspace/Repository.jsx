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
  Plus
} from 'lucide-react';
import { documentService } from '../../services';

export const Repository = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [physicalStatus, setPhysicalStatus] = useState('');
  const [page, setPage] = useState(1);
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
        limit: 10,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, status, department, documentType, physicalStatus, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Effective':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'In Review':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending Approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Superseded':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Archived':
        return 'bg-slate-200 text-slate-800 border-slate-400';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPhysicalStatusBadge = (pst) => {
    switch (pst) {
      case 'Stored':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Checked Out':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'In Transit':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Missing':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">GxP Document Repository</h1>
          <p className="text-xs text-slate-500">
            Regulated repository of pharmaceutical standard procedures, batch records, specifications and validation reports.
          </p>
        </div>
        <button
          onClick={() => navigate('/workspace/upload')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Ingest Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by document number, title, batch number, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
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
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="">All Departments</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Production">Production</option>
              <option value="Regulatory Affairs">Regulatory Affairs</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => { setDocumentType(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
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
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Physical Status</label>
            <select
              value={physicalStatus}
              onChange={(e) => { setPhysicalStatus(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="">All Physical States</option>
              <option value="Stored">Stored in Vault</option>
              <option value="Checked Out">Checked Out</option>
              <option value="In Transit">In Transit</option>
              <option value="Missing">Missing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enterprise Compact Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Doc #</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-3">Rev</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Physical Status</th>
                <th className="py-3 px-3">Custodian</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading repository records...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No documents match the specified criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-orange-700 whitespace-nowrap">
                      {doc.documentNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-[220px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{doc.version}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">{doc.documentType}</td>
                    <td className="py-3 px-3 text-slate-600">{doc.department}</td>
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
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {doc.currentCustodian?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {doc.storageLocation?.code || 'Central'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQrDoc(doc)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded transition"
                          title="View QR Label"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-700 rounded text-xs font-semibold transition"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{documents.length}</strong> of <strong className="text-slate-800">{totalDocs}</strong> records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQrDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Physical Binder Label QR</span>
              <button onClick={() => setSelectedQrDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {selectedQrDoc.qrCodeImage ? (
              <img src={selectedQrDoc.qrCodeImage} alt="QR Code" className="w-44 h-44 mx-auto border p-2 rounded-xl" />
            ) : (
              <div className="w-44 h-44 bg-slate-100 flex items-center justify-center mx-auto text-xs text-slate-400">QR code unavailable</div>
            )}
            <div className="text-left bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div><strong className="text-slate-700">Doc #:</strong> <span className="font-mono">{selectedQrDoc.documentNumber}</span></div>
              <div className="truncate"><strong className="text-slate-700">Title:</strong> {selectedQrDoc.title}</div>
              <div><strong className="text-slate-700">Location:</strong> <span className="font-mono">{selectedQrDoc.storageLocation?.code}</span></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Binder Label
              </button>
              <button
                onClick={() => setSelectedQrDoc(null)}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs"
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

