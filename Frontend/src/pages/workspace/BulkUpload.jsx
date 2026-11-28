import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  User as UserIcon,
  Trash2,
  Edit3,
  Check,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  Eye,
  Info,
  Database,
  ShieldCheck,
  AlertCircle,
  Lock,
  EyeOff,
  FileSignature
} from 'lucide-react';
import { documentService, masterDataService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';

export const BulkUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Queue state
  const [queue, setQueue] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [isExtractingBatch, setIsExtractingBatch] = useState(false);
  const [isIngestingBatch, setIsIngestingBatch] = useState(false);
  const [ingestProgress, setIngestProgress] = useState({ current: 0, total: 0 });

  // Master Data
  const [masterData, setMasterData] = useState({
    locations: [],
    users: [],
    documentTypes: [],
    departments: []
  });
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);

  // Modals
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocationForBatch, setSelectedLocationForBatch] = useState('');

  const [custodianModalOpen, setCustodianModalOpen] = useState(false);
  const [selectedCustodianForBatch, setSelectedCustodianForBatch] = useState('');

  const [inspectModalItem, setInspectModalItem] = useState(null);
  const [ingestConfirmModal, setIngestConfirmModal] = useState(false);

  // 21 CFR Part 11 Electronic Signature for Batch Ingestion
  const [eSignModalOpen, setESignModalOpen] = useState(false);
  const [eSignPassword, setESignPassword] = useState('');
  const [showESignPassword, setShowESignPassword] = useState(false);
  const [eSignMeaning, setESignMeaning] = useState('Author / Ingestion Attestation');
  const [eSignReason, setESignReason] = useState('Bulk GxP Master Document Ingestion & Physical Vault Archival');

  // Load master data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setIsLoadingMasterData(true);
        const res = await masterDataService.getMasterData();
        if (res.success && res.data) {
          setMasterData({
            locations: res.data.locations || [],
            users: res.data.users || [],
            documentTypes: res.data.documentTypes || [],
            departments: res.data.departments || []
          });
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
        toast.error('Unable to load master storage coordinates and authorized custodians.');
      } finally {
        setIsLoadingMasterData(false);
      }
    };
    fetchMasterData();
  }, []);

  // Compute status for an item
  const calculateItemStatus = (item) => {
    if (item.isIngested) return { status: 'ingested', text: 'Ingested' };
    if (item.isIngesting) return { status: 'ingesting', text: 'Ingesting...' };
    if (item.isExtracting) return { status: 'extracting', text: 'AI Parsing...' };
    if (item.isFailed) return { status: 'failed', text: 'Failed' };
    if (item.isDuplicate) return { status: 'duplicate', text: 'Duplicate' };
    if (!item.locationId) return { status: 'needs_review', text: 'Needs review / no location' };
    if (!item.custodianId) return { status: 'needs_review', text: 'Needs custodian' };
    return { status: 'ready', text: 'Ready' };
  };

  // Extract metadata for a single file item
  const processExtractionForItem = async (item) => {
    try {
      const res = await documentService.extractMetadata(item.file);
      if (res.success && res.data) {
        const raw = res.data.extracted || {};
        const classification = res.data.classification || {};
        const rec = res.data.storageRecommendation || {};
        const dup = res.data.duplicateWarning || {};
        const scores = res.data.confidenceScores || {};

        // Calculate confidence level
        let confLevel = 'Medium';
        const overallScore = typeof scores.overall === 'number' ? scores.overall : (classification.confidence || 0.85);
        if (overallScore >= 0.85) confLevel = 'High';
        else if (overallScore < 0.6) confLevel = 'Low';

        // Auto-suggest storage location if available
        const recLocationId = rec.locationId || rec.recommendedLocation?._id || '';
        const recLocationCode = rec.code || rec.recommendedLocation?.code || '';

        // Default type
        const detectedType = classification.documentType || raw.documentType || 'Batch Manufacturing Record (BMR)';
        const detectedDocNo = raw.documentNumber || `DOC-${Date.now().toString().slice(-6)}`;
        const detectedTitle = raw.title || item.file.name.replace(/\.[^/.]+$/, '');
        const detectedDept = raw.department || classification.department || 'Manufacturing';
        const detectedFolder = classification.folder || `${detectedType.split(' ')[0]} / ${raw.product || 'GxP Standard'}`;

        setQueue((prev) =>
          prev.map((q) => {
            if (q.id !== item.id) return q;
            const updated = {
              ...q,
              isExtracting: false,
              serverFile: res.data.file,
              documentNumber: detectedDocNo,
              title: detectedTitle,
              documentType: detectedType,
              department: detectedDept,
              folder: detectedFolder,
              version: raw.version || '1.0',
              product: raw.product || '',
              batchNumber: raw.batchNumber || '',
              effectiveDate: raw.effectiveDate || new Date().toISOString().split('T')[0],
              reviewDate: raw.reviewDate || '',
              expiryDate: raw.expiryDate || '',
              confidence: confLevel,
              confidenceScore: Math.round(overallScore * 100),
              numPages: res.data.file?.numPages || 1,
              recommendedLocationId: recLocationId,
              recommendedLocationCode: recLocationCode,
              locationId: q.locationId || recLocationId,
              locationCode: q.locationCode || recLocationCode,
              custodianId: q.custodianId || user?._id || (masterData.users[0]?._id ?? ''),
              recommendedReason: rec.reason || '',
              isDuplicate: dup.detected || false,
              duplicateInfo: dup.detected ? dup : null,
              extractedRaw: raw,
              textPreview: res.data.file?.textPreview || raw.textPreview || ''
            };
            const stat = calculateItemStatus(updated);
            return { ...updated, status: stat.status, statusText: stat.text };
          })
        );
      }
    } catch (err) {
      console.error(`Extraction failed for ${item.file.name}:`, err);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, isExtracting: false, isFailed: true, status: 'failed', statusText: 'Extraction error' }
            : q
        )
      );
    }
  };

  // Handle file selection (drag or input)
  const handleFileSelect = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    addFilesToQueue(rawFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFilesToQueue = (fileList) => {
    const pdfFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      toast.error('Please upload valid pharmaceutical PDF files.');
      return;
    }

    const defaultCustodian = user?._id || (masterData.users[0]?._id ?? '');

    const newItems = pdfFiles.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        numPages: 1,
        isExtracting: true,
        isFailed: false,
        isIngested: false,
        isIngesting: false,
        status: 'extracting',
        statusText: 'AI Parsing & OCR...',
        documentNumber: '',
        title: file.name.replace(/\.[^/.]+$/, ''),
        documentType: 'Batch Manufacturing Record (BMR)',
        department: 'Manufacturing',
        folder: 'Manufacturing Operations',
        confidence: 'Medium',
        confidenceScore: 75,
        locationId: '',
        locationCode: '',
        recommendedLocationId: '',
        recommendedLocationCode: '',
        recommendedReason: '',
        custodianId: defaultCustodian,
        isDuplicate: false,
        duplicateInfo: null,
        serverFile: null,
        extractedRaw: {}
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
    toast.info(`Queued ${newItems.length} files. Running AI OCR text extraction...`);

    // Process extractions asynchronously
    newItems.forEach((item) => {
      processExtractionForItem(item);
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  // Checkbox selection
  const toggleSelectAll = () => {
    const visibleItems = getFilteredQueue();
    if (selectedIds.size === visibleItems.length && visibleItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((q) => q.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Update a single item field
  const updateQueueItem = (id, field, value) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const stat = calculateItemStatus(updated);
        return { ...updated, status: stat.status, statusText: stat.text };
      })
    );
  };

  // Auto-place all unplaced documents
  const handleAutoPlaceAll = () => {
    const defaultCust = user?._id || (masterData.users.find((u) => u.role === 'Custodian' || u.role === 'Admin')?._id) || (masterData.users[0]?._id ?? '');
    let placedCount = 0;
    setQueue((prev) =>
      prev.map((item) => {
        if (item.isIngested) return item;

        // Try AI recommended location first
        let targetLocation = null;
        if (item.locationId) {
          targetLocation = masterData.locations.find((l) => l._id === item.locationId);
        } else if (item.recommendedLocationId) {
          targetLocation = masterData.locations.find((l) => l._id === item.recommendedLocationId);
        }

        // Fallback: match by department or first available location with capacity
        if (!targetLocation) {
          targetLocation =
            masterData.locations.find(
              (l) =>
                l.department?.toLowerCase() === item.department?.toLowerCase() &&
                (l.capacity - (l.currentOccupancy || 0) > 0)
            ) ||
            masterData.locations.find((l) => (l.capacity - (l.currentOccupancy || 0) > 0)) ||
            masterData.locations[0];
        }

        const targetLocationId = targetLocation?._id || item.locationId || masterData.locations[0]?._id;
        const targetLocationCode = targetLocation?.code || item.locationCode || masterData.locations[0]?.code;
        const targetCustId = item.custodianId || defaultCust;

        if (targetLocationId || targetCustId) {
          placedCount++;
          const updated = {
            ...item,
            locationId: targetLocationId,
            locationCode: targetLocationCode,
            custodianId: targetCustId
          };
          const stat = calculateItemStatus(updated);
          return { ...updated, status: stat.status, statusText: stat.text };
        }
        return item;
      })
    );

    if (placedCount > 0) {
      toast.success(`✨ Auto-placed ${placedCount} document(s) in optimal vault storage and assigned custodians!`);
    } else {
      toast.info('All documents already have storage locations and custodians assigned.');
    }
  };

  // Apply location to selected rows
  const handleBatchApplyLocation = () => {
    if (!selectedLocationForBatch) {
      toast.error('Please choose a storage location to apply.');
      return;
    }
    const loc = masterData.locations.find((l) => l._id === selectedLocationForBatch);
    if (!loc) return;

    setQueue((prev) =>
      prev.map((item) => {
        if (selectedIds.has(item.id) && !item.isIngested) {
          const updated = {
            ...item,
            locationId: loc._id,
            locationCode: loc.code
          };
          const stat = calculateItemStatus(updated);
          return { ...updated, status: stat.status, statusText: stat.text };
        }
        return item;
      })
    );

    toast.success(`Applied location ${loc.code} to ${selectedIds.size} selected document(s).`);
    setLocationModalOpen(false);
    setSelectedLocationForBatch('');
  };

  // Apply custodian to selected rows
  const handleBatchApplyCustodian = () => {
    if (!selectedCustodianForBatch) {
      toast.error('Please choose a custodian to assign.');
      return;
    }
    const cust = masterData.users.find((u) => u._id === selectedCustodianForBatch);
    if (!cust) return;

    setQueue((prev) =>
      prev.map((item) => {
        if (selectedIds.has(item.id) && !item.isIngested) {
          const updated = {
            ...item,
            custodianId: cust._id
          };
          const stat = calculateItemStatus(updated);
          return { ...updated, status: stat.status, statusText: stat.text };
        }
        return item;
      })
    );

    toast.success(`Assigned custodian ${cust.name} to ${selectedIds.size} selected document(s).`);
    setCustodianModalOpen(false);
    setSelectedCustodianForBatch('');
  };

  // Remove selected from queue
  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) {
      toast.info('No documents selected to remove.');
      return;
    }
    const count = selectedIds.size;
    setQueue((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    toast.info(`Removed ${count} document(s) from the processing queue.`);
  };

  // Ingest batch execution
  const executeIngest = async (password, meaning, reason) => {
    setIngestConfirmModal(false);
    setESignModalOpen(false);

    if (!password || !password.trim()) {
      toast.error('Security password is required for 21 CFR Part 11 electronic signature authentication.');
      return;
    }

    const defaultCust = user?._id || (masterData.users.find((u) => u.role === 'Custodian' || u.role === 'Admin')?._id) || (masterData.users[0]?._id ?? '');
    const defaultLoc = masterData.locations[0]?._id ?? '';

    // Filter documents to ingest
    const toIngest = queue.filter((item) => !item.isIngested && !item.isExtracting).map(item => ({
      ...item,
      locationId: item.locationId || defaultLoc,
      custodianId: item.custodianId || defaultCust
    }));

    if (toIngest.length === 0) {
      toast.error('No validated documents ready for ingestion.');
      return;
    }

    setIsIngestingBatch(true);
    setIngestProgress({ current: 0, total: toIngest.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toIngest.length; i++) {
      const item = toIngest[i];
      setIngestProgress({ current: i + 1, total: toIngest.length });

      // Mark row as ingesting
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isIngesting: true, statusText: 'Ingesting...' } : q))
      );

      try {
        const payload = {
          documentNumber: item.documentNumber || `DOC-${Date.now().toString().slice(-6)}`,
          title: item.title || item.name,
          version: item.version || '1.0',
          documentType: item.documentType,
          department: item.department,
          product: item.product || '',
          batchNumber: item.batchNumber || '',
          effectiveDate: item.effectiveDate || new Date().toISOString(),
          reviewDate: item.reviewDate || null,
          expiryDate: item.expiryDate || null,
          preparedBy: user?.name || 'Document Controller',
          currentCustodian: item.custodianId || defaultCust,
          storageLocation: item.locationId || defaultLoc,
          boxNumber: 'BX-01',
          fileNumber: `${item.documentNumber}-F1`,
          physicalCopiesCount: 1,
          fileUrl: item.serverFile?.fileUrl || `/uploads/${item.name}`,
          fileName: item.serverFile?.originalName || item.name,
          fileSize: item.serverFile?.fileSize || item.size,
          fileMimeType: item.serverFile?.fileMimeType || 'application/pdf',
          fileHash: item.serverFile?.fileHash || '',
          folder: item.folder || 'General GxP Records',
          description: `Bulk ingested document. OCR verified confidence: ${item.confidence}.`,
          tags: [item.documentType.split(' ')[0], item.department, 'BulkIngested'].filter(Boolean),
          extractedMetadata: {
            rawValues: item.extractedRaw || {},
            confidence: item.confidenceScore
          },
          password: password.trim(),
          signatureMeaning: meaning || 'Author / Ingestion Attestation',
          reason: reason || 'Bulk GxP Master Document Ingestion & Physical Vault Archival'
        };

        const res = await documentService.createDocument(payload);
        if (res.success && res.data) {
          successCount++;
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                  ...q,
                  isIngesting: false,
                  isIngested: true,
                  status: 'ingested',
                  statusText: 'Ingested',
                  createdDocId: res.data._id
                }
                : q
            )
          );
        } else {
          failCount++;
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                  ...q,
                  isIngesting: false,
                  isFailed: true,
                  status: 'failed',
                  statusText: res.message || 'Ingest failed'
                }
                : q
            )
          );
        }
      } catch (err) {
        console.error(`Failed to ingest ${item.name}:`, err);
        failCount++;
        const msg = err.response?.data?.message || 'Failed';
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                isIngesting: false,
                isFailed: true,
                status: 'failed',
                statusText: msg
              }
              : q
          )
        );
      }
    }

    setIsIngestingBatch(false);
    if (successCount > 0) {
      toast.success(`🎉 Ingestion complete! ${successCount} document(s) securely archived in vault repository.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} document(s) encountered validation errors.`);
    }
  };

  // Ingest button click handler
  const handleStartIngestClick = () => {
    if (queue.length === 0) {
      toast.info('Please upload PDF files to populate the queue.');
      return;
    }

    // Auto-place any unplaced items so location & custodian are ready
    const unplaced = queue.some((item) => !item.isIngested && (!item.locationId || !item.custodianId));
    if (unplaced) {
      handleAutoPlaceAll();
    }

    // Prompt 21 CFR Part 11 Electronic Signature Modal
    setESignPassword('');
    setShowESignPassword(false);
    setESignModalOpen(true);
  };

  // Filtered queue
  const getFilteredQueue = () => {
    if (!filterNeedsReview) return queue;
    return queue.filter((item) => item.status === 'needs_review' || item.status === 'duplicate');
  };

  const filteredQueue = getFilteredQueue();

  // Summary counts
  const totalCount = queue.length;
  const needsReviewCount = queue.filter((i) => i.status === 'needs_review').length;
  const duplicateCount = queue.filter((i) => i.status === 'duplicate').length;
  const readyCount = queue.filter((i) => i.status === 'ready').length;
  const ingestedCount = queue.filter((i) => i.status === 'ingested').length;

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bulk Document Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Drop many scans. Each file is extracted, classified and placed — fix any row, then import the Ready ones.
          </p>
        </div>

        {/* Upload Action Trigger */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 transition shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Add More PDFs
          </button>
        </div>
      </div>

      {/* Drag & Drop Hero Zone (When empty or as a quick dropzone) */}
      {queue.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-solid border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl p-12 text-center bg-white dark:bg-slate-900 transition cursor-pointer group shadow-xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Drag & Drop pharmaceutical PDF records here
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Upload multiple BMRs, BPRs, SOPs, or Certificates of Analysis. AI engine will extract document numbers, suggest compliant vault coordinates, and flag duplicates.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-sm">
            <UploadCloud className="w-4 h-4" /> Browse Local Files
          </div>
        </div>
      ) : (
        /* Processing Queue Container */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Top Queue Bar with Badges and Actions (Exactly matching the reference image) */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Queue Title & Count Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Processing queue ({totalCount})
                </span>

                {needsReviewCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Needs review: {needsReviewCount}
                  </span>
                )}

                {duplicateCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Duplicate: {duplicateCount}
                  </span>
                )}

                {readyCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Ready: {readyCount}
                  </span>
                )}

                {ingestedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    Archived: {ingestedCount}
                  </span>
                )}
              </div>

              {/* Primary Batch Action (Replaces awkward 'Import ready' with high-visibility, functional action) */}
              <div className="flex items-center gap-2">
                <button
                  disabled={isIngestingBatch || totalCount === 0}
                  onClick={handleStartIngestClick}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {isIngestingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting ({ingestProgress.current}/{ingestProgress.total})...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Ingest Documents ({readyCount} Validated)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Toolbar Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Needs review only filter */}
                {/* <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterNeedsReview}
                    onChange={(e) => setFilterNeedsReview(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Needs review only</span>
                </label> */}

                {/* Auto-place all */}
                <button
                  type="button"
                  onClick={handleAutoPlaceAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Auto-place all
                </button>

                {/* Apply location to selected */}
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition disabled:opacity-40"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Apply location to selected {selectedIds.size > 0 && `(${selectedIds.size})`}
                </button>

                {/* Assign custodian */}
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setCustodianModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition disabled:opacity-40"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  Assign custodian {selectedIds.size > 0 && `(${selectedIds.size})`}
                </button>

                {/* Remove */}
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={handleRemoveSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 shadow-2xs transition disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
                  Remove {selectedIds.size > 0 && `(${selectedIds.size})`}
                </button>
              </div>

              {/* Quick queue stats */}
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                Showing {filteredQueue.length} of {totalCount} files
              </div>
            </div>
          </div>

          {/* Ingestion Live Progress Bar */}
          {isIngestingBatch && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                Ingesting and cataloging batch into secure physical archive...
              </div>
              <div className="w-48 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(ingestProgress.current / (ingestProgress.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold sticky top-0 z-10 backdrop-blur-xs">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredQueue.length && filteredQueue.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="py-3 px-3 min-w-[200px]">File</th>
                  <th className="py-3 px-3 min-w-[130px]">Detected Type</th>
                  <th className="py-3 px-3 min-w-[160px]">Doc No.</th>
                  <th className="py-3 px-3 min-w-[170px]">Folder</th>
                  <th className="py-3 px-3 min-w-[80px]">Conf.</th>
                  <th className="py-3 px-3 min-w-[140px]">Location</th>
                  <th className="py-3 px-3 min-w-[140px]">Custodian</th>
                  <th className="py-3 px-3 min-w-[150px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredQueue.map((item) => {
                  const isChecked = selectedIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isChecked ? 'bg-orange-50/20 dark:bg-orange-950/20' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(item.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>

                      {/* FILE column: thumbnail preview, name, pages, text preview */}
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2.5 max-w-[240px]">
                          <div className="w-8 h-10 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                            <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-0.5">PDF</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{item.numPages || 2} p · text</span>
                              <span>•</span>
                              <span>{(item.size / 1024).toFixed(0)} KB</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DETECTED TYPE column */}
                      <td className="py-3 px-3">
                        <select
                          value={item.documentType}
                          onChange={(e) => updateQueueItem(item.id, 'documentType', e.target.value)}
                          className="w-full text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-orange-500"
                        >
                          {masterData.documentTypes.length > 0 ? (
                            masterData.documentTypes.map((dt) => (
                              <option key={dt._id} value={dt.name}>
                                {dt.code} - {dt.name}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Batch Manufacturing Record (BMR)">BMR</option>
                              <option value="Batch Packaging Record (BPR)">BPR</option>
                              <option value="Standard Operating Procedure (SOP)">SOP</option>
                              <option value="Certificate of Analysis (COA)">COA</option>
                              <option value="Validation Protocol / Report">Validation</option>
                              <option value="Specification (SPEC)">Specification</option>
                              <option value="Logbook Record">Logbook</option>
                            </>
                          )}
                        </select>
                      </td>

                      {/* DOC NO. column: editable input */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.documentNumber}
                          placeholder="Doc Number..."
                          onChange={(e) => updateQueueItem(item.id, 'documentNumber', e.target.value)}
                          className="w-full text-xs font-mono font-medium py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </td>

                      {/* FOLDER / Department column */}
                      <td className="py-3 px-3">
                        <div
                          className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-[170px]"
                          title={item.folder}
                        >
                          {item.folder}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.department}
                        </div>
                      </td>

                      {/* CONF. column (Confidence with colored dot) */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.confidence === 'High'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : item.confidence === 'Medium'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                            }`}
                          title={`Extraction Confidence: ${item.confidenceScore}%`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${item.confidence === 'High'
                              ? 'bg-emerald-500'
                              : item.confidence === 'Medium'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              }`}
                          ></span>
                          {item.confidence}
                        </span>
                      </td>

                      {/* LOCATION column: Not placed (amber) or selected location */}
                      <td className="py-3 px-3">
                        {item.locationId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {item.locationCode || 'LOC-V1-R02-S01'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                              Not placed
                            </span>
                            {item.recommendedLocationCode && (
                              <button
                                type="button"
                                title={`AI Recommendation: ${item.recommendedLocationCode}. Click to assign.`}
                                onClick={() => {
                                  updateQueueItem(item.id, 'locationId', item.recommendedLocationId);
                                  updateQueueItem(item.id, 'locationCode', item.recommendedLocationCode);
                                }}
                                className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-950/60 text-orange-600 dark:text-orange-400"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* CUSTODIAN column: dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={item.custodianId}
                          onChange={(e) => updateQueueItem(item.id, 'custodianId', e.target.value)}
                          className="w-full text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-orange-500"
                        >
                          {masterData.users.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* STATUS column: badge + edit pencil */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {item.isIngested ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <Check className="w-3 h-3" /> Ingested
                              </span>
                            ) : item.isIngesting ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Ingesting...
                              </span>
                            ) : item.isDuplicate ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Duplicate
                                </span>
                                <div className="text-[10px] text-rose-500 mt-0.5">Hash / No match</div>
                              </div>
                            ) : item.status === 'needs_review' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Needs review
                                </span>
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                  {!item.locationId ? 'no location' : 'unassigned'}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ready
                              </span>
                            )}
                          </div>

                          {/* Detail / Edit Pencil Icon */}
                          <button
                            type="button"
                            onClick={() => setInspectModalItem(item)}
                            title="Inspect & edit extracted metadata"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Apply Storage Location in Batch */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Batch Assign Storage Location ({selectedIds.size} selected)
                </h3>
              </div>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an authorized physical vault location coordinate to assign across all checked documents.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {masterData.locations.map((loc) => {
                const isSelected = selectedLocationForBatch === loc._id;
                const available = loc.capacity - (loc.currentOccupancy || 0);

                return (
                  <div
                    key={loc._id}
                    onClick={() => setSelectedLocationForBatch(loc._id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${isSelected
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                        {loc.code}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {loc.building} • Rack {loc.rack} • Shelf {loc.shelf} ({loc.department || 'GxP Standard'})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${available > 5 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'
                        }`}>
                        {available} slots free
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedLocationForBatch}
                onClick={handleBatchApplyLocation}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm disabled:opacity-50"
              >
                Apply to Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Batch Assign Custodian */}
      {custodianModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assign Accountable Custodian ({selectedIds.size} selected)
                </h3>
              </div>
              <button
                onClick={() => setCustodianModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign an accountable GxP personnel for physical custody and checkout governance.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {masterData.users.map((cust) => {
                const isSelected = selectedCustodianForBatch === cust._id;

                return (
                  <div
                    key={cust._id}
                    onClick={() => setSelectedCustodianForBatch(cust._id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${isSelected
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {cust.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cust.email} • {cust.role} ({cust.department || 'QA'})
                      </div>
                    </div>
                    {cust.employeeId && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {cust.employeeId}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCustodianModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedCustodianForBatch}
                onClick={handleBatchApplyCustodian}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm disabled:opacity-50"
              >
                Assign Custodian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Ingestion Confirmation with Smart Auto-Place fallback */}
      {ingestConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Ingestion Scope
                </h3>
                <p className="text-xs text-slate-500">
                  {queue.filter((i) => !i.locationId).length} document(s) have no vault location assigned.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pharmaceutical regulations (21 CFR Part 11 / Annex 11) require every physical document record to have a registered coordinate in the vault repository.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleAutoPlaceAll();
                  setTimeout(() => executeIngest(false), 200);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition"
              >
                <Sparkles className="w-4 h-4" /> Auto-place All With AI & Ingest Everything
              </button>

              {readyCount > 0 && (
                <button
                  type="button"
                  onClick={() => executeIngest(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
                >
                  Ingest Only Ready Documents ({readyCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setIngestConfirmModal(false)}
                className="w-full text-center py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Cancel and Review Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Inspect / Edit Item Metadata */}
      {inspectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-blur animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Extracted Document Inspection
                  </h3>
                  <div className="text-[11px] text-slate-400">{inspectModalItem.name}</div>
                </div>
              </div>
              <button
                onClick={() => setInspectModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inspectModalItem.isDuplicate && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <div className="font-bold">Duplicate Document Detected</div>
                  <div>
                    Matches existing repository record{' '}
                    <span className="font-mono font-semibold">
                      {inspectModalItem.duplicateInfo?.documentNumber}
                    </span>{' '}
                    ({inspectModalItem.duplicateInfo?.matchType || 'Exact File Hash Match'}).
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  value={inspectModalItem.documentNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInspectModalItem((prev) => ({ ...prev, documentNumber: val }));
                    updateQueueItem(inspectModalItem.id, 'documentNumber', val);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={inspectModalItem.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInspectModalItem((prev) => ({ ...prev, title: val }));
                    updateQueueItem(inspectModalItem.id, 'title', val);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Product / Formulation
                </label>
                <input
                  type="text"
                  value={inspectModalItem.product}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInspectModalItem((prev) => ({ ...prev, product: val }));
                    updateQueueItem(inspectModalItem.id, 'product', val);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={inspectModalItem.batchNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInspectModalItem((prev) => ({ ...prev, batchNumber: val }));
                    updateQueueItem(inspectModalItem.id, 'batchNumber', val);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={inspectModalItem.department}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInspectModalItem((prev) => ({ ...prev, department: val }));
                    updateQueueItem(inspectModalItem.id, 'department', val);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Storage Vault Location
                </label>
                <select
                  value={inspectModalItem.locationId || ''}
                  onChange={(e) => {
                    const locId = e.target.value;
                    const locObj = masterData.locations.find((l) => l._id === locId);
                    setInspectModalItem((prev) => ({
                      ...prev,
                      locationId: locId,
                      locationCode: locObj?.code || ''
                    }));
                    updateQueueItem(inspectModalItem.id, 'locationId', locId);
                    updateQueueItem(inspectModalItem.id, 'locationCode', locObj?.code || '');
                  }}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Not Placed --</option>
                  {masterData.locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.code} ({loc.building} - Rack {loc.rack})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {inspectModalItem.recommendedReason && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-xl border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-bold">AI Storage Recommendation:</div>
                  <div>{inspectModalItem.recommendedReason}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectModalItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 21 CFR Part 11 Batch Electronic Signature Modal */}
      {eSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-blur animate-fade-in">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5 animate-modal-pop">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    21 CFR Part 11 Electronic Signature
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Batch Ingestion Attestation & Chain of Custody Binding
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setESignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Signer Identity Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Signer Identity:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {user?.name || 'Anita Sharma'} ({user?.role || 'Admin'})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Pending Ingestion:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {queue.filter((q) => !q.isIngested).length} document(s)
                </span>
              </div>
            </div>

            {/* Signature Meaning */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Signature Meaning / Purpose
              </label>
              <select
                value={eSignMeaning}
                onChange={(e) => setESignMeaning(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Author / Ingestion Attestation">Author / Ingestion Attestation</option>
                <option value="Review & Vault Registration">Review & Vault Registration</option>
                <option value="Custodian Transfer & Storage Verification">Custodian Transfer & Storage Verification</option>
                <option value="Quality Assurance Vault Approval">Quality Assurance Vault Approval</option>
              </select>
            </div>

            {/* Justification / Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Audit Trail Justification / Reason
              </label>
              <input
                type="text"
                value={eSignReason}
                onChange={(e) => setESignReason(e.target.value)}
                placeholder="State reason for batch document ingestion"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Password Re-authentication */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account Password (21 CFR Part 11 Re-auth) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Required</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showESignPassword ? 'text' : 'password'}
                  value={eSignPassword}
                  onChange={(e) => setESignPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && eSignPassword.trim()) {
                      setESignModalOpen(false);
                      executeIngest(eSignPassword, eSignMeaning, eSignReason);
                    }
                  }}
                  placeholder="Enter your security password to sign"
                  autoFocus
                  className="w-full text-xs pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowESignPassword(!showESignPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  {showESignPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Regulatory Compliance Footnote */}
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/60 text-[11px] text-orange-900 dark:text-orange-200 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" />
              <span>
                By clicking <strong>Sign & Ingest</strong>, you certify under penalty of perjury that this action is your legally binding signature equivalent to a handwritten signature pursuant to FDA 21 CFR Part 11.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setESignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!eSignPassword.trim() || isIngestingBatch}
                onClick={() => {
                  setESignModalOpen(false);
                  executeIngest(eSignPassword, eSignMeaning, eSignReason);
                }}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
                  !eSignPassword.trim() || isIngestingBatch
                    ? 'bg-orange-400 opacity-60 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                <FileSignature className="w-3.5 h-3.5" />
                Sign & Ingest ({queue.filter((q) => !q.isIngested).length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
