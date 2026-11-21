import React, { useState, useEffect } from 'react';
import { CalendarClock, AlertTriangle, CheckCircle, ShieldAlert, Lock, Clock } from 'lucide-react';
import { documentService } from '../../services';

export const ReviewRetention = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocuments({ limit: 50, sortBy: 'reviewDate', sortOrder: 'asc' });
      if (res.success && res.data) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const now = new Date();

  const handleToggleLegalHold = async (doc) => {
    const newState = !doc.legalHold;
    if (!window.confirm(`${newState ? 'Place' : 'Remove'} legal hold on ${doc.documentNumber}?`)) return;

    try {
      const res = await documentService.updateMetadata(doc._id, { legalHold: newState });
      if (res.success) fetchDocs();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Periodic Review & Retention Governance</h1>
          <p className="text-xs text-slate-500">
            Enforce scheduled periodic document reviews, archive retention cycles, and regulatory legal holds.
          </p>
        </div>
      </div>

      {/* Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Effective Date</th>
                <th className="py-3 px-3">Next Review Due</th>
                <th className="py-3 px-3">Retention</th>
                <th className="py-3 px-3">Legal Hold</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">Loading review schedules...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">No scheduled reviews found.</td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const reviewDate = doc.reviewDate ? new Date(doc.reviewDate) : null;
                  const isOverdue = reviewDate && reviewDate < now;
                  return (
                    <tr key={doc._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 truncate max-w-xs">
                        <div className="font-mono font-bold text-teal-700">{doc.documentNumber}</div>
                        <div className="text-[11px] text-slate-600 truncate">{doc.title}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{doc.documentType}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {doc.effectiveDate ? new Date(doc.effectiveDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {reviewDate ? reviewDate.toLocaleDateString() : 'Unscheduled'}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-rose-500 font-bold uppercase">Overdue</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{doc.retentionYears || 5} Years</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          doc.legalHold ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {doc.legalHold ? 'ON HOLD' : 'Standard'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleLegalHold(doc)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            doc.legalHold
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {doc.legalHold ? 'Release Hold' : 'Place Legal Hold'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

