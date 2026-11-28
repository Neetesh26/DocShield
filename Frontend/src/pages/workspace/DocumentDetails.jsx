import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  QrCode,
  Printer,
  Download,
  Edit3,
  History,
  GitBranch,
  Layers,
  ShieldCheck,
  Building,
  Box,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  ChevronLeft,
  X,
  FileCheck2,
  Lock
} from 'lucide-react';
import { documentService, requestService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { AiDocumentAssistant } from '../../components/documents/AiDocumentAssistant';

export const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('viewer');
  const [error, setError] = useState('');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('Print');
  const [requestReason, setRequestReason] = useState('');
  const [requestUrgency, setRequestUrgency] = useState('Normal');
  const [requestSuccess, setRequestSuccess] = useState('');

  const [showWhereIsItModal, setShowWhereIsItModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your GxP Document Assistant. Ask me to summarize this procedure, highlight critical control points, or generate a compliance quiz.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocumentById(id);
      if (res.success && res.data) {
        setDocData(res.data);
      } else {
        setError('Document not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Handle New Request Submission
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requestReason.trim()) return;

    try {
      const res = await requestService.createRequest({
        documentId: id,
        requestType,
        reason: requestReason,
        urgency: requestUrgency
      });
      if (res.success) {
        setRequestSuccess(`Request ${res.data.requestNumber} submitted for QA review.`);
        setRequestReason('');
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestSuccess('');
          fetchDocument();
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request');
    }
  };

  // Handle AI Assistant Prompt
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;

    const userPrompt = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setChatInput('');
    setAiLoading(true);

    try {
      const res = await documentService.askAssistant(id, userPrompt);
      if (res.success && res.data) {
        if (!res.data.configured) {
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'assistant',
              text: `ℹ️ ${res.data.message}\n(Document Context Verified: ${res.data.documentContext?.documentNumber} - ${res.data.documentContext?.title})`
            }
          ]);
        } else {
          setChatMessages(prev => [
            ...prev,
            { sender: 'assistant', text: res.data.response }
          ]);
        }
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'Error connecting to Document Assistant engine.' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium">Loading GxP Document Dossier...</p>
      </div>
    );
  }

  if (!docData?.document) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Document Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested document could not be located in the repository.</p>
        <button
          onClick={() => navigate('/workspace/repository')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs"
        >
          Back to Repository
        </button>
      </div>
    );
  }

  const { document: doc, versions = [], requests = [], auditLogs = [], relatedDocs = [] } = docData;

  const currentUserId = String(user?._id || user?.id || '');
  const isRestrictedUser = ['User', 'User / Viewer', 'Viewer', 'Employee'].includes(user?.role);
  const hasApprovedDownload = requests.some(
    (r) =>
      r.requestType === 'Download' &&
      r.status === 'Approved' &&
      String(r.requester?._id || r.requester) === currentUserId
  );
  const canDownloadPdf = !isRestrictedUser || hasApprovedDownload;

  const now = new Date();
  const isReviewPast = doc.reviewDate && new Date(doc.reviewDate) < now;
  const isExpiryPast = doc.expiryDate && new Date(doc.expiryDate) < now;
  const isExpired = doc.status === 'Expired' || isReviewPast || isExpiryPast;

  const tabs = [
    { id: 'viewer', label: 'Viewer', icon: FileText },
    { id: 'metadata', label: 'Metadata', icon: FileCheck2 },
    { id: 'location', label: 'Location & Custody', icon: MapPin },
    { id: 'versions', label: `Versions (${versions.length})`, icon: GitBranch },
    { id: 'assistant', label: 'Procedure Q&A', icon: MessageSquare },
    { id: 'requests', label: `Requests (${requests.length})`, icon: Clock },
    { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
    { id: 'related', label: `Related (${relatedDocs.length})`, icon: Layers }
  ];

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/workspace/repository')}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Document Repository
        </button>
      </div>

      {/* Sticky Header with Document Information & Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-lg text-orange-950">{doc.documentNumber}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Rev {doc.version}
            </span>
            {isExpired ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                Expired
              </span>
            ) : doc.status === 'Effective' ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Effective
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                {doc.status}
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Physical: {doc.physicalStatus}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 mt-1">{doc.title}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
            <span>Dept: <strong className="text-slate-700 font-semibold">{doc.department}</strong></span>
            <span>•</span>
            <span>Custodian: <strong className="text-slate-700 font-semibold">{doc.currentCustodian?.name || 'Unassigned'}</strong></span>
            <span>•</span>
            <span>Vault: <strong className="font-mono text-slate-700">{doc.storageLocation?.code || 'Central'}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowWhereIsItModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            Where is it?
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-600" />
            Label
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Request Print / Download
          </button>
        </div>
      </div>

      {/* GxP Compliance Warning Alert for Expired / Overdue Document */}
      {isExpired && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3.5 text-rose-900 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-rose-800">
                GxP Compliance Alert: Controlled Document Expired / Periodic Review Lapsed
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-200/80 text-rose-900 uppercase">
                Invalid for Operational Use
              </span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              This controlled document has passed its designated <strong>Next Review Date ({doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : 'Lapsed'})</strong>{doc.expiryDate ? ` / Expiry Date (${new Date(doc.expiryDate).toLocaleDateString()})` : ''}. Under 21 CFR Part 11 and Good Documentation Practices (GDP), this procedure is legally invalid for active batch manufacturing, QC testing, or product release until formally re-assessed, revised, and re-approved by QA.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto bg-white px-4 rounded-xl shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              } ${tab.isAi ? 'text-indigo-600' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PDF VIEWER + AI DOCUMENT ASSISTANT */}
      {activeTab === 'viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">Official Controlled Document Preview</span>
              <div className="flex items-center gap-2">
                {canDownloadPdf ? (
                  <a
                    href={doc.fileUrl}
                    download={doc.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Authorized PDF
                  </a>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestType('Download');
                        setShowRequestModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-xs font-semibold border border-orange-200 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Request Download
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                      <Lock className="w-3 h-3" /> View only
                    </span>
                  </>
                )}
              </div>
            </div>
            <div
              onContextMenu={(e) => {
                if (!canDownloadPdf) e.preventDefault();
              }}
              className="w-full h-[650px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200"
            >
              <iframe
                src={canDownloadPdf ? doc.fileUrl : `${doc.fileUrl}#toolbar=0&navpanes=0`}
                title="Document PDF"
                className="w-full h-full border-0"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <AiDocumentAssistant documentId={id} doc={doc} />
          </div>
        </div>
      )}

      {/* TAB 2: METADATA */}
      {activeTab === 'metadata' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            GxP Regulatory Document Metadata Sheet
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document Number</span>
              <span className="font-mono font-bold text-orange-700 text-sm">{doc.documentNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Title</span>
              <span className="font-semibold text-slate-800">{doc.title}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Version</span>
              <span className="font-mono text-slate-700">{doc.version}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document Type</span>
              <span className="font-medium text-slate-800">{doc.documentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
              <span className="font-medium text-slate-800">{doc.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Product</span>
              <span className="text-slate-700">{doc.product || 'Facility-Wide'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Batch Number</span>
              <span className="font-mono text-slate-700">{doc.batchNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Effective Date</span>
              <span className="font-mono text-slate-700">{doc.effectiveDate ? new Date(doc.effectiveDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Next Review Date</span>
              <span className={`font-mono flex items-center gap-1.5 ${isReviewPast ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                {doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : 'N/A'}
                {isReviewPast && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                    Overdue
                  </span>
                )}
              </span>
            </div>
            {doc.expiryDate && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expiry Date</span>
                <span className={`font-mono flex items-center gap-1.5 ${isExpiryPast ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                  {new Date(doc.expiryDate).toLocaleDateString()}
                  {isExpiryPast && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                      Expired
                    </span>
                  )}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Author / Prepared By</span>
              <span className="text-slate-700">{doc.preparedBy || 'Unspecified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reviewed By</span>
              <span className="text-slate-700">{doc.reviewedBy || 'Unspecified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Approved By</span>
              <span className="text-slate-700">{doc.approvedBy || 'Dr. Sarah Jenkins'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Retention Period</span>
              <span className="font-semibold text-slate-800">{doc.retentionYears || 5} Years</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Legal Hold Active</span>
              <span className={`font-semibold ${doc.legalHold ? 'text-rose-600' : 'text-slate-600'}`}>
                {doc.legalHold ? 'YES (Hold Active)' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Folder Category</span>
              <span className="text-slate-700">{doc.folder}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOCATION & CUSTODY */}
      {activeTab === 'location' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Physical Archival Hierarchy
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Building:</span>
                <span className="font-semibold text-slate-800">{doc.storageLocation?.building}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Area:</span>
                <span className="font-semibold text-slate-800">{doc.storageLocation?.area}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Room:</span>
                <span className="font-mono text-slate-800">{doc.storageLocation?.room}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Rack / Shelf / Bin:</span>
                <span className="font-mono font-bold text-orange-700">{doc.storageLocation?.code}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Box Identifier:</span>
                <span className="font-mono text-slate-800">{doc.boxNumber || 'BX-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physical File #:</span>
                <span className="font-mono text-slate-800">{doc.fileNumber || `${doc.documentNumber}-F1`}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Accountable Custodian
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Custodian Name:</span>
                <span className="font-bold text-slate-900">{doc.currentCustodian?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{doc.currentCustodian?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{doc.currentCustodian?.department}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono text-slate-700">{doc.currentCustodian?.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physical Copies in Circulation:</span>
                <span className="font-mono font-bold text-slate-800">{doc.physicalCopiesCount || 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVISION HISTORY */}
      {activeTab === 'versions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Revision History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="pb-2">Version</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Changelog</th>
                  <th className="pb-2">Uploaded By</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {versions.map((ver) => (
                  <tr key={ver._id}>
                    <td className="py-2.5 font-mono font-bold text-orange-700">{ver.version}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                        {ver.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700">{ver.changesDescription}</td>
                    <td className="py-2.5 text-slate-600">{ver.uploadedBy?.name || 'Quality System'}</td>
                    <td className="py-2.5 font-mono text-slate-500">{new Date(ver.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENT INQUIRIES & COMPLIANCE Q&A */}
      {activeTab === 'assistant' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Procedure & Compliance Inquiries
                </h2>
                <p className="text-[11px] text-slate-500">
                  Contextual procedure reference grounded on document {doc.documentNumber} ({doc.title}).
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
              Regulatory Reference Active
            </span>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => {
                setChatInput('Summarize the critical control points of this document.');
              }}
              className="px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100 transition whitespace-nowrap cursor-pointer"
            >
              Summarize critical control points
            </button>
            <button
              onClick={() => {
                setChatInput('Generate a 3-question training quiz based on this procedure.');
              }}
              className="px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100 transition whitespace-nowrap cursor-pointer"
            >
              Generate compliance quiz
            </button>
            <button
              onClick={() => {
                setChatInput('What are the key deviation actions mentioned in this SOP?');
              }}
              className="px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100 transition whitespace-nowrap cursor-pointer"
            >
              Key deviation actions
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="text-slate-400 text-xs italic flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Analyzing document text...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about this document..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={aiLoading || !chatInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Ask
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Document Requests & Checkouts
            </h2>
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              + Submit New Request
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="pb-2">Req #</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Requester</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">No requests submitted for this document</td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r._id}>
                      <td className="py-2.5 font-mono font-bold text-orange-900">{r.requestNumber}</td>
                      <td className="py-2.5 font-medium">{r.requestType}</td>
                      <td className="py-2.5">{r.requester?.name || 'User'}</td>
                      <td className="py-2.5 text-slate-600 truncate max-w-xs">{r.reason}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'Approved' ? 'bg-orange-50 text-orange-800 border border-orange-200' : r.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: 21 CFR PART 11 AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            21 CFR Part 11 Immutable Document History
          </h2>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No audit events recorded</div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {log.userName} ({log.userRole})
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-900 border border-orange-200">
                      {log.action}
                    </span>
                    <span className="text-slate-600">{log.details}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 8: RELATED DOCUMENTS */}
      {activeTab === 'related' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Related Procedures & Protocols
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relatedDocs.map((rel) => (
              <div
                key={rel._id}
                onClick={() => navigate(`/documents/${rel._id}`)}
                className="p-3 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/20 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-orange-800">{rel.documentNumber}</div>
                  <div className="font-medium text-slate-800 truncate max-w-xs">{rel.title}</div>
                  <div className="text-[10px] text-slate-400">Rev {rel.version} • {rel.department}</div>
                </div>
                <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Request Print / Checkout */}
      {showRequestModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Request Document Action</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-center font-medium">
                {requestSuccess}
              </div>
            ) : (
              <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="Print">Controlled Print Copy</option>
                    <option value="Download">Controlled Electronic Download</option>
                    <option value="Checkout">Physical Binder Checkout</option>
                    <option value="Custody Change">Custody Transfer</option>
                    <option value="Document Change">Document Revision Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Regulatory Justification Reason *</label>
                  <textarea
                    rows="3"
                    required
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="State GxP operational justification (e.g. required for batch testing run)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Urgency</label>
                  <select
                    value={requestUrgency}
                    onChange={(e) => setRequestUrgency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent (Production Critical)</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-xs hover:shadow transition cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Where Is It? (3D / Coordinate Locator) */}
      {showWhereIsItModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Physical Coordinate Locator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhereIsItModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Document Number:</span>
                <span className="font-mono font-bold text-orange-700 dark:text-orange-400">{doc.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Target Facility:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.storageLocation?.building}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Archive Vault / Area:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.storageLocation?.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Room:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{doc.storageLocation?.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Exact Shelf Coordinate:</span>
                <span className="font-mono font-bold text-orange-700 dark:text-orange-400">{doc.storageLocation?.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Box & File Tag:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{doc.boxNumber} / {doc.fileNumber}</span>
              </div>
            </div>

            {/* Visual rack illustration */}
            <div className="p-4 bg-[#0F172A] rounded-xl text-white text-center space-y-2">
              <span className="text-[11px] font-mono text-orange-400 block uppercase">
                Rack Visual Locator
              </span>
              <div className="grid grid-cols-4 gap-1.5 max-w-xs mx-auto py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((bin) => (
                  <div
                    key={bin}
                    className={`h-10 rounded border flex items-center justify-center text-[10px] font-mono ${
                      bin === 2 ? 'bg-orange-500 border-orange-300 text-slate-900 font-bold shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Bin {bin} {bin === 2 ? '★' : ''}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Target File highlighted at Bin 2 on Shelf 1.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowWhereIsItModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close Locator
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Printable QR Label */}
      {showQrModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Physical Binder Label</span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            {doc.qrCodeImage ? (
              <img src={doc.qrCodeImage} alt="QR Code" className="w-44 h-44 mx-auto border border-slate-200 dark:border-slate-700 p-2 rounded-xl bg-white" />
            ) : (
              <div className="w-44 h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-xs text-slate-400 rounded-xl">QR code unavailable</div>
            )}
            <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-700">
              <div><strong className="text-slate-700 dark:text-slate-300">Doc #:</strong> <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">{doc.documentNumber}</span></div>
              <div className="truncate"><strong className="text-slate-700 dark:text-slate-300">Title:</strong> <span className="text-slate-800 dark:text-slate-200">{doc.title}</span></div>
              <div><strong className="text-slate-700 dark:text-slate-300">Location:</strong> <span className="font-mono text-slate-800 dark:text-slate-200">{doc.storageLocation?.code}</span></div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs hover:shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Binder Spine Label
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

