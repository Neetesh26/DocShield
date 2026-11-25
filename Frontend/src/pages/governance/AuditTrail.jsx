import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { auditService } from '../../services';

export const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected entry modal
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
        limit: 15
      });
      if (res.success && res.data) {
        setLogs(res.data);
        if (res.meta) {
          setTotal(res.meta.total || 0);
          setTotalPages(res.meta.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, entity, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">FDA 21 CFR Part 11 Audit Trail</h1>
        </div>
        {/* <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <span>Integrity Verification Active (Append-Only)</span>
        </div> */}
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by operator name..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All GxP Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="METADATA_EDIT">METADATA_EDIT</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="CHECKOUT">CHECKOUT</option>
            <option value="RETURN">RETURN</option>
            <option value="HANDOVER">HANDOVER</option>
            <option value="PHYSICAL_AUDIT">PHYSICAL_AUDIT</option>
          </select>

          <select
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Entities</option>
            <option value="Document">Document</option>
            <option value="Approval">Approval</option>
            <option value="DocumentRequest">DocumentRequest</option>
            <option value="CheckoutRecord">CheckoutRecord</option>
            <option value="Handover">Handover</option>
            <option value="PhysicalAudit">PhysicalAudit</option>
          </select>

          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Filter Logs
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">Timestamp (UTC/Local)</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-3">IP</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">No audit events match criteria.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{log.userName}</td>
                    <td className="py-3 px-3 text-slate-600">{log.userRole}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-700 truncate max-w-sm" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(log)}
                        className="p-1 text-slate-500 hover:text-orange-700"
                        title="View Full Metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{logs.length}</strong> of <strong className="text-slate-800">{total}</strong> immutable events
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

      {/* Inspect Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Audit Trail Record Inspector</h3>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Event Timestamp:</span>
                <span className="font-mono text-slate-800">{new Date(selectedEntry.timestamp).toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span className="font-semibold text-slate-800">{selectedEntry.userName} ({selectedEntry.userRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-mono font-bold text-orange-800">{selectedEntry.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Entity:</span>
                <span className="font-mono text-slate-800">{selectedEntry.entity} (ID: {selectedEntry.entityId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IP Address:</span>
                <span className="font-mono text-slate-800">{selectedEntry.ipAddress}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Details:</span>
                <p className="text-slate-800 leading-relaxed font-medium">{selectedEntry.details}</p>
              </div>
              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Raw Event Metadata:</span>
                  <pre className="bg-slate-900 text-teal-300 p-2 rounded text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

