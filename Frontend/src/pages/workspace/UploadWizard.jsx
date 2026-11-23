import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building,
  Box,
  UserCheck,
  QrCode,
  Tag,
  Calendar,
  Info,
  Check,
  Eye,
  FileCheck2
} from 'lucide-react';
import { documentService, storageService, masterDataService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';

export const UploadWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: File
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Step 2: Extracted Metadata & Confidence
  const [metadata, setMetadata] = useState({
    documentNumber: '',
    title: '',
    version: '1.0',
    documentType: 'Standard Operating Procedure (SOP)',
    department: 'Quality Assurance',
    product: '',
    batchNumber: '',
    effectiveDate: '',
    reviewDate: '',
    expiryDate: '',
    preparedBy: '',
    reviewedBy: '',
    approvedBy: '',
    folder: 'Controlled Procedures',
    tags: '',
    description: '',
    category: 'Procedure'
  });

  const [confidenceScores, setConfidenceScores] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [classification, setClassification] = useState(null);
  const [serverFile, setServerFile] = useState(null);

  // Step 3: Storage & Custody
  const [storageRecommendation, setStorageRecommendation] = useState(null);
  const [storageLocations, setStorageLocations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedCustodianId, setSelectedCustodianId] = useState('');
  const [physicalCopies, setPhysicalCopies] = useState(1);
  const [boxNumber, setBoxNumber] = useState('BX-01');
  const [fileNumber, setFileNumber] = useState('');
  const [custodyRemarks, setCustodyRemarks] = useState('');

  // Step 4: Final electronic signature
  const [signatureChecked, setSignatureChecked] = useState(false);
  const [completedDoc, setCompletedDoc] = useState(null);

  // Load storage locations & users
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [locRes, userRes] = await Promise.all([
          storageService.getLocations(),
          masterDataService.getUsers()
        ]);
        if (locRes.success) setStorageLocations(locRes.data || []);
        if (userRes.success) {
          setUsersList(userRes.data || []);
          if (user?._id) setSelectedCustodianId(user._id);
        }
      } catch (err) {
        console.error('Failed to load master locations or users', err);
      }
    };
    loadMasterData();
  }, [user]);

  // Handle File Selection
  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('GxP validation requires PDF documents.');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError('Document file size exceeds 25MB limit.');
        return;
      }
      setError('');
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Step 1 -> Step 2: Trigger backend extraction
  const handleProceedToExtraction = async () => {
    if (!selectedFile) {
      setError('Please select or drop a valid PDF document to proceed.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await documentService.extractMetadata(selectedFile);

      if (res.success && res.data) {
        setServerFile(res.data.file);
        setConfidenceScores(res.data.confidenceScores || {});
        setDuplicateWarning(res.data.duplicateWarning || null);
        setClassification(res.data.classification || null);
        setStorageRecommendation(res.data.storageRecommendation || null);
        setTotalPages(res.data.file.numPages || 1);

        // Prepopulate metadata from extracted raw values and classification
        const ext = res.data.extracted || {};
        const cls = res.data.classification || {};

        setMetadata(prev => ({
          ...prev,
          documentNumber: ext.documentNumber || prev.documentNumber || `SOP-QA-${Math.floor(1000 + Math.random() * 9000)}`,
          title: ext.title || selectedFile.name.replace(/\.pdf$/i, ''),
          version: ext.version || '1.0',
          documentType: cls.documentType || ext.documentType || prev.documentType,
          department: ext.department || cls.department || prev.department,
          product: ext.product || '',
          batchNumber: ext.batchNumber || '',
          effectiveDate: ext.effectiveDate || new Date().toISOString().split('T')[0],
          reviewDate: ext.reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expiryDate: ext.expiryDate || '',
          preparedBy: ext.preparedBy || user?.name || '',
          reviewedBy: ext.reviewedBy || '',
          approvedBy: ext.approvedBy || '',
          folder: cls.folder || prev.folder,
          tags: (cls.suggestedTags || ['GxP']).join(', ')
        }));

        if (res.data.storageRecommendation?.locationId) {
          setSelectedLocationId(res.data.storageRecommendation.locationId);
        }

        setCurrentStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Metadata extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Apply Storage Recommendation
  const handleApplyRecommendation = () => {
    if (storageRecommendation?.locationId) {
      setSelectedLocationId(storageRecommendation.locationId);
    }
  };

  // Step 4: Submit Final Ingestion
  const handleFinalSubmit = async () => {
    if (!signatureChecked) {
      setError('You must check the 21 CFR Part 11 Electronic Signature confirmation before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        documentNumber: metadata.documentNumber,
        title: metadata.title,
        version: metadata.version,
        documentType: metadata.documentType,
        department: metadata.department,
        product: metadata.product,
        batchNumber: metadata.batchNumber,
        effectiveDate: metadata.effectiveDate,
        reviewDate: metadata.reviewDate,
        expiryDate: metadata.expiryDate,
        preparedBy: metadata.preparedBy,
        reviewedBy: metadata.reviewedBy,
        approvedBy: metadata.approvedBy,
        currentCustodian: selectedCustodianId,
        storageLocation: selectedLocationId,
        boxNumber,
        fileNumber: fileNumber || `${metadata.documentNumber}-F1`,
        physicalCopiesCount: Number(physicalCopies) || 1,
        fileUrl: serverFile?.fileUrl || '',
        fileName: serverFile?.originalName || selectedFile?.name || '',
        fileSize: serverFile?.fileSize || selectedFile?.size || 0,
        fileMimeType: serverFile?.fileMimeType || 'application/pdf',
        fileHash: serverFile?.fileHash || '',
        tags: metadata.tags.split(',').map(t => t.trim()).filter(Boolean),
        folder: metadata.folder,
        description: metadata.description,
        extractedMetadata: {
          rawValues: metadata,
          confidenceScores
        }
      };

      const res = await documentService.createDocument(payload);
      if (res.success && res.data) {
        setCompletedDoc(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize document ingestion.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for confidence badge
  const renderConfidenceBadge = (fieldName) => {
    const item = confidenceScores[fieldName];
    if (!item) return null;
    const level = item.level;
    if (level === 'High') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-orange-50 text-orange-800 border border-orange-200">
          High Conf ({Math.round(item.score * 100)}%)
        </span>
      );
    } else if (level === 'Medium') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Medium ({Math.round(item.score * 100)}%)
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Review Needed
      </span>
    );
  };

  const steps = [
    { num: 1, title: 'FILE INGESTION', desc: 'PDF drag & drop' },
    { num: 2, title: 'HEADER EXTRACTION', desc: 'Metadata & confidence' },
    { num: 3, title: 'STORAGE & CUSTODY', desc: 'Physical coordinates' },
    { num: 4, title: 'REVIEW & SIGN', desc: '21 CFR Part 11 sign-off' }
  ];

  if (completedDoc) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Successfully Ingested & Stored</h2>
          <p className="text-xs text-slate-500 mt-1">
            Registered into DocuShield GxP Archive under strict regulatory compliance.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Document Number:</span>
            <span className="font-mono font-bold text-orange-700">{completedDoc.documentNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Title:</span>
            <span className="font-medium text-slate-800 truncate max-w-xs">{completedDoc.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Physical Vault Location:</span>
            <span className="font-mono text-slate-700">{completedDoc.storageLocation?.code || 'Assigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Current Custodian:</span>
            <span className="font-semibold text-slate-800">{completedDoc.currentCustodian?.name || 'Assigned'}</span>
          </div>
        </div>

        {completedDoc.qrCodeImage && (
          <div className="p-4 border border-slate-200 rounded-xl bg-white inline-block">
            <img src={completedDoc.qrCodeImage} alt="Document QR Code" className="w-36 h-36 mx-auto" />
            <span className="text-[10px] font-mono text-slate-400 block mt-2">
              Scan to verify binder physical custody
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => navigate(`/documents/${completedDoc._id}`)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Open Document Details
          </button>
          <button
            onClick={() => {
              setCompletedDoc(null);
              setSelectedFile(null);
              setFilePreviewUrl(null);
              setCurrentStep(1);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            Upload Another Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">GxP Document Ingestion Pipeline</h1>
            <p className="text-xs text-slate-500">
              Four-step regulated ingestion with intelligent OCR extraction and physical location assignment.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
            <FileCheck2 className="w-4 h-4" />
            <span>Step {currentStep} of 4</span>
          </div>
        </div>

        {/* 4-Step Visual Progress Bar */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {steps.map((st) => (
            <div
              key={st.num}
              className={`p-3 rounded-xl border transition ${
                currentStep === st.num
                  ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-semibold'
                  : currentStep > st.num
                  ? 'border-slate-300 bg-slate-100/60 text-slate-800'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  currentStep > st.num ? 'bg-orange-600 text-white' : currentStep === st.num ? 'bg-orange-500 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {currentStep > st.num ? <Check className="w-3 h-3" /> : st.num}
                </span>
                <span className="text-[11px] uppercase tracking-wider">{st.title}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 pl-7">{st.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: FILE INGESTION */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dropzone */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Select Document PDF</h2>
              <p className="text-xs text-slate-500 mb-4">
                Upload pharmaceutical SOP, Batch Record (BMR/BPR), or Specification.
              </p>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-orange-50/20 transition cursor-pointer"
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileDrop}
                />
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Click to browse or drag & drop PDF here
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supported format: PDF up to 25MB
                </div>
              </div>

              {selectedFile && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-orange-700" />
                    <div>
                      <div className="text-xs font-semibold text-orange-900 truncate max-w-xs">{selectedFile.name}</div>
                      <div className="text-[10px] text-orange-600">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreviewUrl(null);
                    }}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
              <button
                disabled={!selectedFile || loading}
                onClick={handleProceedToExtraction}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Running OCR & Header Extraction...' : 'Continue to Header Extraction'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Preview Pane */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Document Preview</h2>
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden min-h-[350px]">
              {filePreviewUrl ? (
                <iframe
                  src={filePreviewUrl}
                  title="PDF Preview"
                  className="w-full h-full min-h-[400px] border-0"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">No PDF uploaded yet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: HEADER EXTRACTION */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Duplicate Detection Warning Banner */}
          {duplicateWarning?.detected && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold flex items-center gap-2">
                  Potential Duplicate Document Detected ({duplicateWarning.matchType})
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    duplicateWarning.isEffective ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-800'
                  }`}>
                    Current Status: {duplicateWarning.status}
                  </span>
                </div>
                <p>
                  A record with Document Number <span className="font-mono font-bold">{duplicateWarning.documentNumber}</span> titled "{duplicateWarning.title}" (Version {duplicateWarning.version}) already exists in the repository.
                </p>
                <p className="text-amber-800 text-[11px]">
                  Ensure you update the Version or verify if you intend to revise an existing procedure.
                </p>
              </div>
            </div>
          )}

          {/* Auto-Classification Pill */}
          {classification && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-950">
                  Auto-Classification Suggestion: <strong className="font-bold">{classification.documentType}</strong> in folder <strong className="font-bold">"{classification.folder}"</strong>
                </span>
              </div>
              <span className="text-[11px] text-orange-800 font-mono">
                Engine: {classification.engine}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: PDF Embedded Viewer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Source Document (Page 1 of {totalPages})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Extraction Source: pdf-parse</span>
              </div>
              <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden min-h-[500px]">
                {filePreviewUrl ? (
                  <iframe src={filePreviewUrl} title="Source PDF" className="w-full h-full min-h-[500px] border-0" />
                ) : (
                  <div className="p-6 text-xs text-slate-400 text-center">Preview unavailable</div>
                )}
              </div>
            </div>

            {/* Right: Extracted Metadata Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Extracted Header Fields</h2>
                <span className="text-[11px] text-slate-400">Review & edit verified values</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Document No. *</label>
                    {renderConfidenceBadge('documentNumber')}
                  </div>
                  <input
                    type="text"
                    value={metadata.documentNumber}
                    onChange={(e) => setMetadata({ ...metadata, documentNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Version *</label>
                    {renderConfidenceBadge('version')}
                  </div>
                  <input
                    type="text"
                    value={metadata.version}
                    onChange={(e) => setMetadata({ ...metadata, version: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Document Title *</label>
                  {renderConfidenceBadge('title')}
                </div>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type *</label>
                  <select
                    value={metadata.documentType}
                    onChange={(e) => setMetadata({ ...metadata, documentType: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                  >
                    <option value="Standard Operating Procedure (SOP)">Standard Operating Procedure (SOP)</option>
                    <option value="Batch Manufacturing Record (BMR)">Batch Manufacturing Record (BMR)</option>
                    <option value="Batch Packaging Record (BPR)">Batch Packaging Record (BPR)</option>
                    <option value="Validation Protocol / Report">Validation Protocol / Report</option>
                    <option value="Specification (SPEC)">Specification (SPEC)</option>
                    <option value="Analytical Method (ATM)">Analytical Method (ATM)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Department *</label>
                    {renderConfidenceBadge('department')}
                  </div>
                  <select
                    value={metadata.department}
                    onChange={(e) => setMetadata({ ...metadata, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                  >
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Production">Production</option>
                    <option value="Regulatory Affairs">Regulatory Affairs</option>
                    <option value="Research & Development">Research & Development</option>
                    <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Product</label>
                    {renderConfidenceBadge('product')}
                  </div>
                  <input
                    type="text"
                    value={metadata.product}
                    onChange={(e) => setMetadata({ ...metadata, product: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Batch Number</label>
                    {renderConfidenceBadge('batchNumber')}
                  </div>
                  <input
                    type="text"
                    value={metadata.batchNumber}
                    onChange={(e) => setMetadata({ ...metadata, batchNumber: e.target.value })}
                    placeholder="e.g. BTH-2026-001"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={metadata.effectiveDate ? metadata.effectiveDate.split('T')[0] : ''}
                    onChange={(e) => setMetadata({ ...metadata, effectiveDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Review Date</label>
                  <input
                    type="date"
                    value={metadata.reviewDate ? metadata.reviewDate.split('T')[0] : ''}
                    onChange={(e) => setMetadata({ ...metadata, reviewDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={metadata.expiryDate ? metadata.expiryDate.split('T')[0] : ''}
                    onChange={(e) => setMetadata({ ...metadata, expiryDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prepared By</label>
                  <input
                    type="text"
                    value={metadata.preparedBy}
                    onChange={(e) => setMetadata({ ...metadata, preparedBy: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reviewed By</label>
                  <input
                    type="text"
                    value={metadata.reviewedBy}
                    onChange={(e) => setMetadata({ ...metadata, reviewedBy: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={metadata.approvedBy}
                    onChange={(e) => setMetadata({ ...metadata, approvedBy: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={metadata.tags}
                  onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Navigation Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to File
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  Continue to Storage & Custody <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: STORAGE & CUSTODY */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Storage Recommendation Banner */}
          {storageRecommendation && (
            <div className="bg-gradient-to-r from-orange-50 via-white to-slate-50 border border-orange-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    Rule-Based Storage Recommendation
                    <span className="text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 rounded-full font-semibold border border-orange-200">
                      {storageRecommendation.occupancyPercentage}% Occupied
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{storageRecommendation.reason}</p>
                  <div className="mt-1 font-mono text-[11px] text-orange-800 font-semibold">
                    Coordinate: {storageRecommendation.code}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyRecommendation}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs shrink-0 transition cursor-pointer"
              >
                Apply Recommendation
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Physical Storage Location Hierarchy */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-slate-900">Physical Storage Coordinates</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Storage Location (Rack/Shelf/Bin) *
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                >
                  <option value="">-- Select Validated Storage Vault --</option>
                  {storageLocations.map((loc) => (
                    <option key={loc._id} value={loc._id} disabled={loc.status === 'Full'}>
                      {loc.code} ({loc.building} - {loc.department}) [{loc.currentOccupancy}/{loc.capacity} slots] {loc.status === 'Full' ? '(FULL)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Box / Binder Identifier</label>
                  <input
                    type="text"
                    value={boxNumber}
                    onChange={(e) => setBoxNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical File #</label>
                  <input
                    type="text"
                    value={fileNumber}
                    placeholder={`${metadata.documentNumber}-F1`}
                    onChange={(e) => setFileNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-slate-700">Location Coordinate Hierarchy:</div>
                <div className="text-slate-500 text-[11px]">
                  Building → Area → Room → Rack → Shelf → Bin → Box
                </div>
              </div>
            </div>

            {/* Custody Assignment */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserCheck className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-slate-900">Chain of Custody & Physical Copies</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designated Accountable Custodian *
                </label>
                <select
                  value={selectedCustodianId}
                  onChange={(e) => setSelectedCustodianId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                >
                  <option value="">-- Assign Responsible Personnel --</option>
                  {usersList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role} - {u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Authorized Physical Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={physicalCopies}
                  onChange={(e) => setPhysicalCopies(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custody Assignment Remarks
                </label>
                <textarea
                  rows="2"
                  value={custodyRemarks}
                  onChange={(e) => setCustodyRemarks(e.target.value)}
                  placeholder="e.g. Master original archived in central vault; 1 controlled copy to QC lab"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Metadata
            </button>
            <button
              type="button"
              disabled={!selectedLocationId || !selectedCustodianId}
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              Continue to Review & Sign <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SIGN */}
      {currentStep === 4 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 4: Final GxP Review & Electronic Signature</h2>
            <p className="text-xs text-slate-500">
              Verify all extracted metadata and physical storage allocations before 21 CFR Part 11 sign-off.
            </p>
          </div>

          {/* Review Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document Number</span>
              <span className="font-mono font-bold text-orange-700 text-sm">{metadata.documentNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Title</span>
              <span className="font-semibold text-slate-800 truncate block">{metadata.title}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Version</span>
              <span className="font-mono text-slate-700">{metadata.version}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Type</span>
              <span className="font-medium text-slate-800">{metadata.documentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
              <span className="font-medium text-slate-800">{metadata.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Effective Date</span>
              <span className="font-mono text-slate-700">{metadata.effectiveDate || 'Immediate'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Physical Location</span>
              <span className="font-mono font-bold text-slate-800">
                {storageLocations.find(l => l._id === selectedLocationId)?.code || 'Assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Designated Custodian</span>
              <span className="font-semibold text-orange-800">
                {usersList.find(u => u._id === selectedCustodianId)?.name || 'Assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Physical Copies</span>
              <span className="font-mono font-bold text-slate-800">{physicalCopies}</span>
            </div>
          </div>

          {/* Electronic Signature Box */}
          <div className="p-5 border-2 border-orange-200 rounded-2xl bg-orange-50/30 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-700" />
              <h3 className="text-xs font-bold text-orange-950 uppercase tracking-wide">
                21 CFR Part 11 Electronic Signature Confirmation
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              By checking the box below, I verify under penalty of regulatory non-compliance that the metadata and physical location registered for document <strong className="font-mono">{metadata.documentNumber}</strong> are accurate, truthful, and authorized in accordance with standard pharmaceutical quality management practices.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <input
                id="sign-check"
                type="checkbox"
                checked={signatureChecked}
                onChange={(e) => setSignatureChecked(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="sign-check" className="text-xs font-semibold text-slate-800 cursor-pointer">
                I, {user?.name || 'Authorized Operator'} ({user?.employeeId || 'EMP'}), digitally sign and authorize this ingestion.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button3D
              type="button"
              variant="light"
              size="md"
              onClick={() => setCurrentStep(3)}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Storage
            </Button3D>
            <Button3D
              type="button"
              variant="primary"
              size="md"
              disabled={!signatureChecked || loading}
              onClick={handleFinalSubmit}
            >
              {loading ? 'Committing 21 CFR Transaction...' : 'Complete Ingestion & Generate QR Code'}
              <Check className="w-4 h-4 ml-1.5" />
            </Button3D>
          </div>
        </div>
      )}
    </div>
  );
};

