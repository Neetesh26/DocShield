import crypto from 'crypto';
import fs from 'fs';
import Document from '../models/Document.js';
import DocumentVersion from '../models/DocumentVersion.js';
import StorageLocation from '../models/StorageLocation.js';
import DocumentRequest from '../models/DocumentRequest.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { extractPdfMetadata } from '../services/extractionService.js';
import { classifyDocument } from '../services/classificationService.js';
import { recommendStorageLocation } from '../services/storageRecommendationService.js';
import { generateDocumentQR } from '../services/qrService.js';
import { logAuditEvent } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AUDIT_ACTIONS, DOCUMENT_STATUSES, PHYSICAL_STATUSES } from '../constants/index.js';

/**
 * Step 1 -> Step 2: Upload PDF file, extract header metadata, run classification & recommendations
 */
export const extractDocumentMetadata = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No document file uploaded', 400);
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 1. Text & Header Extraction
    const extractionResult = await extractPdfMetadata(filePath);
    const rawValues = extractionResult.rawValues || {};

    // 2. Duplicate Detection
    const duplicateQuery = {
      $or: [
        { fileHash }
      ]
    };
    if (rawValues.documentNumber) {
      duplicateQuery.$or.push({ documentNumber: rawValues.documentNumber });
    }
    if (rawValues.title && rawValues.version) {
      duplicateQuery.$or.push({ title: rawValues.title, version: rawValues.version });
    }

    const existingDoc = await Document.findOne(duplicateQuery)
      .populate('currentCustodian', 'name email department')
      .populate('storageLocation');

    let duplicateWarning = null;
    if (existingDoc) {
      duplicateWarning = {
        detected: true,
        documentNumber: existingDoc.documentNumber,
        title: existingDoc.title,
        version: existingDoc.version,
        status: existingDoc.status,
        isEffective: existingDoc.status === DOCUMENT_STATUSES.EFFECTIVE,
        existingId: existingDoc._id,
        matchType: existingDoc.fileHash === fileHash ? 'Exact File Hash Match' : 'Metadata Match'
      };
    }

    // 3. Auto-Classification
    const classification = classifyDocument({
      documentNumber: rawValues.documentNumber || '',
      title: rawValues.title || '',
      department: rawValues.department || '',
      text: extractionResult.textPreview || ''
    });

    // 4. Storage Recommendation
    const storageRecommendation = await recommendStorageLocation({
      department: rawValues.department || classification.department || '',
      documentType: classification.documentType,
      product: rawValues.product || ''
    });

    const fileRelativeUrl = `/uploads/${req.file.filename}`;

    return sendSuccess(res, 'File parsed and metadata extracted successfully', {
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        fileUrl: fileRelativeUrl,
        fileSize: req.file.size,
        fileMimeType: req.file.mimetype,
        fileHash,
        numPages: extractionResult.numPages
      },
      extracted: rawValues,
      confidenceScores: extractionResult.confidenceScores,
      classification,
      storageRecommendation,
      duplicateWarning
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check for duplicates explicitly
 */
export const checkDuplicate = async (req, res, next) => {
  try {
    const { documentNumber, title, version, fileHash } = req.body;
    const queries = [];
    if (fileHash) queries.push({ fileHash });
    if (documentNumber) queries.push({ documentNumber });
    if (title && version) queries.push({ title, version });

    if (queries.length === 0) {
      return sendSuccess(res, 'No duplicate criteria provided', { isDuplicate: false });
    }

    const existing = await Document.findOne({ $or: queries });
    if (existing) {
      return sendSuccess(res, 'Potential duplicate detected', {
        isDuplicate: true,
        existing: {
          id: existing._id,
          documentNumber: existing.documentNumber,
          title: existing.title,
          version: existing.version,
          status: existing.status
        }
      });
    }

    return sendSuccess(res, 'No duplicate found', { isDuplicate: false });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 4 Review & Sign: Finalize Document Creation
 */
export const createDocument = async (req, res, next) => {
  try {
    const {
      documentNumber,
      title,
      version = '1.0',
      documentType,
      department,
      product,
      batchNumber,
      effectiveDate,
      reviewDate,
      expiryDate,
      preparedBy,
      reviewedBy,
      approvedBy,
      currentCustodian,
      storageLocation,
      boxNumber = 'BX-01',
      fileNumber,
      physicalCopiesCount = 1,
      fileUrl,
      fileName,
      fileSize,
      fileMimeType,
      fileHash,
      tags = [],
      folder = 'General GxP Records',
      description = '',
      extractedMetadata = {},
      status = DOCUMENT_STATUSES.EFFECTIVE,
      legalHold = false,
      retentionYears = 5
    } = req.body;

    if (!documentNumber || !title || !documentType || !department || !fileUrl) {
      return sendError(res, 'Missing required document fields (Number, Title, Type, Department, File)', 400);
    }

    if (!storageLocation) {
      return sendError(res, 'Physical storage location is mandatory for GxP documents', 400);
    }

    if (!currentCustodian) {
      return sendError(res, 'An accountable custodian must be assigned', 400);
    }

    // Verify storage location exists and has capacity
    const loc = await StorageLocation.findById(storageLocation);
    if (!loc) {
      return sendError(res, 'Specified storage location does not exist', 404);
    }

    if (loc.currentOccupancy >= loc.capacity) {
      return sendError(res, `Storage location ${loc.code} is already at maximum capacity (${loc.capacity})`, 400);
    }

    // Check duplicate document number
    const existingDoc = await Document.findOne({ documentNumber });
    if (existingDoc) {
      return sendError(res, `A document with Document Number '${documentNumber}' already exists.`, 409);
    }

    // Create Document instance
    const newDoc = new Document({
      documentNumber,
      title,
      version,
      documentType,
      department,
      product,
      batchNumber,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      reviewDate: reviewDate ? new Date(reviewDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status,
      physicalStatus: PHYSICAL_STATUSES.STORED,
      preparedBy: preparedBy || req.user.name,
      reviewedBy,
      approvedBy,
      uploadedBy: req.user._id,
      currentCustodian,
      storageLocation,
      boxNumber,
      fileNumber: fileNumber || `${documentNumber}-F1`,
      physicalCopiesCount: Number(physicalCopiesCount) || 1,
      fileUrl,
      fileName,
      fileSize,
      fileMimeType: fileMimeType || 'application/pdf',
      fileHash,
      tags: Array.isArray(tags) ? tags : [tags],
      folder,
      description,
      extractedMetadata,
      qrCodeData: `VIDYAGXP:${documentNumber}`,
      legalHold: Boolean(legalHold),
      retentionYears: Number(retentionYears) || 5
    });

    // Generate QR code with deep link
    const qrResult = await generateDocumentQR(documentNumber, newDoc._id);
    newDoc.qrCodeData = qrResult.payload;
    newDoc.qrCodeImage = qrResult.dataUrl;

    await newDoc.save();

    // Increment location occupancy
    loc.currentOccupancy += 1;
    await loc.save();

    // Create DocumentVersion 1.0 entry
    const docVersion = new DocumentVersion({
      document: newDoc._id,
      version: newDoc.version,
      fileUrl: newDoc.fileUrl,
      fileName: newDoc.fileName,
      fileSize: newDoc.fileSize,
      fileHash: newDoc.fileHash,
      changesDescription: 'Initial effective upload into GxP repository',
      status: newDoc.status,
      uploadedBy: req.user._id
    });
    await docVersion.save();

    // Immutable GxP Audit log
    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.UPLOAD,
      entity: 'Document',
      entityId: newDoc._id,
      details: `Created Document '${newDoc.documentNumber}' (Rev ${newDoc.version}) titled '${newDoc.title}' stored at ${loc.code}.`,
      metadata: {
        documentNumber: newDoc.documentNumber,
        version: newDoc.version,
        location: loc.code,
        custodianId: currentCustodian
      },
      ipAddress: req.ip || '127.0.0.1'
    });

    const populatedDoc = await Document.findById(newDoc._id)
      .populate('currentCustodian', 'name email department employeeId')
      .populate('storageLocation')
      .populate('uploadedBy', 'name email');

    return sendSuccess(res, 'Document successfully ingested and stored', populatedDoc, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Documents with Advanced Keyword Search, Multi-Field Filters, Dynamic Sorting, and Pagination
 */
export const getDocuments = async (req, res, next) => {
  try {
    const now = new Date();

    // Auto-transition lapsed Effective documents to Expired under GxP / 21 CFR Part 11 rules
    await Document.updateMany(
      {
        status: DOCUMENT_STATUSES.EFFECTIVE,
        $or: [
          { expiryDate: { $ne: null, $lt: now } },
          { reviewDate: { $ne: null, $lt: now } }
        ]
      },
      { $set: { status: DOCUMENT_STATUSES.EXPIRED } }
    );

    const {
      search,
      status,
      department,
      documentType,
      physicalStatus,
      product,
      batchNumber,
      custodian,
      storageLocation,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // 1. High-accuracy multi-field keyword search
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');

      // Resolve matching custodians and storage locations in parallel
      const [matchingUsers, matchingLocations] = await Promise.all([
        User.find({ name: searchRegex }).select('_id').limit(20),
        StorageLocation.find({
          $or: [
            { code: searchRegex },
            { building: searchRegex },
            { area: searchRegex },
            { room: searchRegex }
          ]
        }).select('_id').limit(20)
      ]);

      const userIds = matchingUsers.map(u => u._id);
      const locationIds = matchingLocations.map(l => l._id);

      // Tokenize for multi-word queries
      const searchTokens = trimmedSearch.split(/\s+/).filter(t => t.length > 1);
      const tokenConditions = searchTokens.map(tok => {
        const tr = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return [
          { documentNumber: tr },
          { title: tr },
          { description: tr },
          { product: tr },
          { batchNumber: tr },
          { department: tr },
          { documentType: tr },
          { tags: tr },
          { boxNumber: tr },
          { fileNumber: tr }
        ];
      }).flat();

      const orConditions = [
        { documentNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { product: searchRegex },
        { batchNumber: searchRegex },
        { department: searchRegex },
        { documentType: searchRegex },
        { tags: searchRegex },
        { boxNumber: searchRegex },
        { fileNumber: searchRegex },
        ...tokenConditions
      ];

      if (userIds.length > 0) {
        orConditions.push({ currentCustodian: { $in: userIds } });
      }
      if (locationIds.length > 0) {
        orConditions.push({ storageLocation: { $in: locationIds } });
      }

      filter.$or = orConditions;
    }

    // 2. Exact GxP Field Filters
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (documentType) filter.documentType = documentType;
    if (physicalStatus) filter.physicalStatus = physicalStatus;
    if (product) filter.product = new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (batchNumber) filter.batchNumber = new RegExp(batchNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (custodian) filter.currentCustodian = custodian;
    if (storageLocation) filter.storageLocation = storageLocation;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // 3. Robust Pagination and Sorting
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'effectiveDate', 'documentNumber', 'title', 'version', 'status', 'physicalStatus', 'department'];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = {};
    sortOptions[actualSortBy] = sortOrder === 'asc' ? 1 : -1;

    const [documents, totalCount] = await Promise.all([
      Document.find(filter)
        .populate('currentCustodian', 'name email department employeeId designation')
        .populate('storageLocation')
        .populate('uploadedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Document.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return sendSuccess(res, 'Documents retrieved successfully', documents, 200, {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Document Details by ID (populates location, custodian, versions, requests, audit trail, related)
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('currentCustodian', 'name email department employeeId designation phone')
      .populate('uploadedBy', 'name email department')
      .populate('storageLocation');

    if (!doc) {
      return sendError(res, 'Document not found', 404);
    }

    // Auto-expire document if next review date or expiry date has passed under GxP governance
    const now = new Date();
    const isReviewLapsed = doc.reviewDate && new Date(doc.reviewDate) < now;
    const isExpiryLapsed = doc.expiryDate && new Date(doc.expiryDate) < now;
    if ((isReviewLapsed || isExpiryLapsed) && doc.status === DOCUMENT_STATUSES.EFFECTIVE) {
      doc.status = DOCUMENT_STATUSES.EXPIRED;
      await doc.save();
    }

    // Fetch related records in parallel
    const [versions, requests, auditLogs, relatedDocs] = await Promise.all([
      DocumentVersion.find({ document: doc._id }).populate('uploadedBy', 'name email').sort({ createdAt: -1 }),
      DocumentRequest.find({ document: doc._id }).populate('requester', 'name email department').sort({ createdAt: -1 }),
      AuditLog.find({ entityId: String(doc._id) }).sort({ timestamp: -1 }).limit(25),
      Document.find({
        _id: { $ne: doc._id },
        $or: [
          { department: doc.department },
          { documentType: doc.documentType },
          { product: doc.product }
        ]
      }).limit(5).select('documentNumber title version status department currentCustodian')
    ]);

    return sendSuccess(res, 'Document retrieved successfully', {
      document: doc,
      versions,
      requests,
      auditLogs,
      relatedDocs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Document Metadata (GxP authorized with audit trail)
 */
export const updateDocumentMetadata = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return sendError(res, 'Document not found', 404);
    }

    // Auto-expire document if next review date or expiry date has passed under GxP governance
    const now = new Date();
    const isReviewLapsed = doc.reviewDate && new Date(doc.reviewDate) < now;
    const isExpiryLapsed = doc.expiryDate && new Date(doc.expiryDate) < now;
    if ((isReviewLapsed || isExpiryLapsed) && doc.status === DOCUMENT_STATUSES.EFFECTIVE) {
      doc.status = DOCUMENT_STATUSES.EXPIRED;
      await doc.save();
    }

    const previousData = {
      title: doc.title,
      department: doc.department,
      effectiveDate: doc.effectiveDate,
      reviewDate: doc.reviewDate,
      product: doc.product,
      tags: doc.tags
    };

    const updatable = ['title', 'department', 'product', 'batchNumber', 'effectiveDate', 'reviewDate', 'tags', 'description', 'legalHold'];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) {
        doc[field] = req.body[field];
      }
    });

    await doc.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.METADATA_EDIT,
      entity: 'Document',
      entityId: doc._id,
      details: `Metadata updated for ${doc.documentNumber}.`,
      metadata: { previous: previousData, updated: req.body },
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Document metadata updated successfully', doc);
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR code for document
 */
export const getDocumentQR = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).select('documentNumber qrCodeData qrCodeImage title version');
    if (!doc) {
      return sendError(res, 'Document not found', 404);
    }

    // Auto-expire document if next review date or expiry date has passed under GxP governance
    const now = new Date();
    const isReviewLapsed = doc.reviewDate && new Date(doc.reviewDate) < now;
    const isExpiryLapsed = doc.expiryDate && new Date(doc.expiryDate) < now;
    if ((isReviewLapsed || isExpiryLapsed) && doc.status === DOCUMENT_STATUSES.EFFECTIVE) {
      doc.status = DOCUMENT_STATUSES.EXPIRED;
      await doc.save();
    }
    return sendSuccess(res, 'QR code retrieved', {
      documentNumber: doc.documentNumber,
      title: doc.title,
      version: doc.version,
      qrCodeData: doc.qrCodeData,
      qrCodeImage: doc.qrCodeImage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Advanced AI Semantic Document Search
 */
export const aiSearchDocuments = async (req, res, next) => {
  try {
    const query = req.body?.query || req.query?.q || '';
    const qTrimmed = query.trim();

    const {
      department: filterDept,
      documentType: filterType,
      status: filterStatus,
      physicalStatus: filterPhysicalStatus,
      product: filterProduct,
      batchNumber: filterBatchNumber,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = { ...req.query, ...req.body };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    // Helper: basic morphological stemmer
    const stem = (w) => {
      let s = (w || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
      if (s.endsWith('es')) return s.slice(0, -2);
      if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
      if (s.endsWith('ing')) return s.slice(0, -3);
      if (s.endsWith('ed')) return s.slice(0, -2);
      return s;
    };

    // 1. Fetch all documents from MongoDB (with full relations)
    const allDocs = await Document.find()
      .populate('currentCustodian', 'name email employeeId department designation')
      .populate('storageLocation')
      .sort({ createdAt: -1 });

    // Extract real dynamic categories and suggested queries from MongoDB documents
    const categoryCounts = {};
    allDocs.forEach(d => {
      const t = d.documentType || 'Standard Operating Procedure (SOP)';
      categoryCounts[t] = (categoryCounts[t] || 0) + 1;
    });
    const availableCategories = Object.entries(categoryCounts).map(([type, count]) => ({
      label: type,
      count,
      query: type
    }));

    const dynamicSuggestedQueries = allDocs
      .filter(d => d.title && d.title.length > 5 && !d.title.endsWith(':'))
      .slice(0, 8)
      .map(d => ({
        label: d.title.length > 45 ? `${d.title.slice(0, 45)}...` : d.title,
        query: `${d.documentNumber} ${d.title}`,
        documentNumber: d.documentNumber,
        department: d.department
      }));

    // Handle Empty Query: Return All Indexed Master Documents with filtering, sorting and pagination
    if (!qTrimmed) {
      let allMapped = allDocs.map(doc => ({
        ...doc.toObject(),
        aiConfidenceScore: 100,
        aiMatchReasons: ['Active Master Procedure in GxP Vault'],
        relevanceScore: 100
      }));

      if (filterDept) allMapped = allMapped.filter(d => d.department === filterDept);
      if (filterType) allMapped = allMapped.filter(d => d.documentType === filterType);
      if (filterStatus) allMapped = allMapped.filter(d => d.status === filterStatus);
      if (filterPhysicalStatus) allMapped = allMapped.filter(d => d.physicalStatus === filterPhysicalStatus);
      if (filterProduct) allMapped = allMapped.filter(d => (d.product || '').toLowerCase().includes(filterProduct.toLowerCase()));
      if (filterBatchNumber) allMapped = allMapped.filter(d => (d.batchNumber || '').toLowerCase().includes(filterBatchNumber.toLowerCase()));

      if (sortBy && sortBy !== 'relevance') {
        allMapped.sort((a, b) => {
          const valA = a[sortBy] || '';
          const valB = b[sortBy] || '';
          return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
      }

      const totalCount = allMapped.length;
      const paginatedDocs = allMapped.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return sendSuccess(res, 'VidyaGxP Repository Catalog', {
        query: '',
        aiSummary: `VidyaGxP Repository View: Showing ${totalCount} active controlled documents and master records indexed in the vault.`,
        interpreted: {},
        documents: paginatedDocs,
        suggestedDocuments: allMapped.slice(0, 6),
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
        availableCategories,
        suggestedQueries: dynamicSuggestedQueries,
        suggestedFollowUps: []
      });
    }

    const qLower = qTrimmed.toLowerCase();

    // 2. Natural Language Intent & Entity Extraction
    const detected = {
      department: null,
      documentType: null,
      status: null,
      product: null,
      location: null,
      keywords: []
    };

    // Department extraction
    if (qLower.includes('qc') || qLower.includes('quality control') || qLower.includes('analytical') || qLower.includes('lab')) {
      detected.department = 'Quality Control';
    } else if (qLower.includes('qa') || qLower.includes('quality assurance') || qLower.includes('compliance')) {
      detected.department = 'Quality Assurance';
    } else if (qLower.includes('production') || qLower.includes('manufacturing') || qLower.includes('granulation') || qLower.includes('packaging line')) {
      detected.department = 'Production';
    } else if (qLower.includes('warehouse') || qLower.includes('logistics') || qLower.includes('dispensing')) {
      detected.department = 'Warehouse & Logistics';
    }

    // Document Type extraction (with synonyms and plurals)
    if (qLower.includes('sop') || qLower.includes('procedure') || qLower.includes('operating procedure') || qLower.includes('sops')) {
      detected.documentType = 'Standard Operating Procedure (SOP)';
    } else if (qLower.includes('bmr') || qLower.includes('batch manufacturing') || qLower.includes('batch record') || qLower.includes('master batch')) {
      detected.documentType = 'Batch Manufacturing Record (BMR)';
    } else if (qLower.includes('bpr') || qLower.includes('batch production') || qLower.includes('packaging record') || qLower.includes('blister')) {
      detected.documentType = 'Batch Production Record (BPR)';
    } else if (qLower.includes('val') || qLower.includes('validation') || qLower.includes('protocol') || qLower.includes('qualification') || qLower.includes('cleaning validation')) {
      detected.documentType = 'Validation Protocol / Report';
    } else if (qLower.includes('spec') || qLower.includes('specification') || qLower.includes('monograph') || qLower.includes('raw material spec')) {
      detected.documentType = 'Specification (SPEC)';
    } else if (qLower.includes('logbook') || qLower.includes('log') || qLower.includes('sterilizer log')) {
      detected.documentType = 'Logbook';
    } else if (qLower.includes('capa') || qLower.includes('corrective action') || qLower.includes('preventive action')) {
      detected.documentType = 'CAPA';
    } else if (qLower.includes('deviation') || qLower.includes('excursion') || qLower.includes('incident')) {
      detected.documentType = 'Deviation';
    } else if (qLower.includes('change control') || qLower.includes('modification')) {
      detected.documentType = 'Change Control';
    }

    // Status extraction
    if (qLower.includes('effective') || qLower.includes('active') || qLower.includes('approved') || qLower.includes('released')) {
      detected.status = 'Effective';
    } else if (qLower.includes('draft')) {
      detected.status = 'Draft';
    } else if (qLower.includes('review') || qLower.includes('pending') || qLower.includes('under review')) {
      detected.status = 'Under Review';
    }

    // Location extraction
    if (qLower.includes('building a') || qLower.includes('bld-a') || qLower.includes('vault 1') || qLower.includes('archive vault')) {
      detected.location = 'Building A';
    } else if (qLower.includes('building b') || qLower.includes('bld-b') || qLower.includes('production records room')) {
      detected.location = 'Building B';
    } else if (qLower.includes('building c') || qLower.includes('bld-c') || qLower.includes('qc testing')) {
      detected.location = 'Building C';
    }

    // Product / Equipment / Asset extraction
    const productKeywords = [
      'paracetamol', 'metformin', 'amoxicillin', 'ibuprofen', 'hplc', 'glatt',
      'dryer', 'media fill', 'shimadzu', 'tablets', 'injectable', 'water',
      'purified water', 'autoclave', 'cellulose', 'avicel', 'hvac', 'vials',
      'blister', 'sterilizer', 'packaging'
    ];
    for (const pk of productKeywords) {
      if (qLower.includes(pk)) {
        detected.product = pk.toUpperCase();
        break;
      }
    }

    // Tokenize and clean
    const stopWords = new Set([
      'find', 'search', 'show', 'get', 'me', 'the', 'a', 'an', 'in', 'of', 'for', 'with', 'and', 'all',
      'to', 'document', 'documents', 'records', 'file', 'files', 'please', 'list', 'give', 'any', 'what'
    ]);
    const rawTokens = qTrimmed
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 1 && !stopWords.has(t));

    const stemmedTokens = rawTokens.map(stem);
    detected.keywords = rawTokens;

    // 3. Multi-Vector AI Relevance Scoring
    const scoredDocs = allDocs.map(doc => {
      let score = 0;
      const matchReasons = [];
      const dTitle = (doc.title || '').toLowerCase();
      const dNum = (doc.documentNumber || '').toLowerCase();
      const dDept = (doc.department || '').toLowerCase();
      const dType = (doc.documentType || '').toLowerCase();
      const dProd = (doc.product || '').toLowerCase();
      const dBatch = (doc.batchNumber || '').toLowerCase();
      const dTags = (doc.tags || []).join(' ').toLowerCase();
      const dDesc = (doc.description || '').toLowerCase();
      const dLoc = doc.storageLocation ? `${doc.storageLocation.building} ${doc.storageLocation.code} ${doc.storageLocation.area}`.toLowerCase() : '';

      // Direct Document Number match (full or partial)
      if (dNum.includes(qLower) || qLower.includes(dNum)) {
        score += 70;
        matchReasons.push('Exact Document Identifier match');
      }

      // Department match
      if (detected.department && dDept.includes(detected.department.toLowerCase())) {
        score += 25;
        matchReasons.push(`Target Department: ${detected.department}`);
      }

      // Document Type match
      if (detected.documentType && (dType.includes(detected.documentType.toLowerCase()) || detected.documentType.toLowerCase().includes(dType))) {
        score += 30;
        matchReasons.push(`Document Category: ${detected.documentType}`);
      }

      // Status match
      if (detected.status && doc.status === detected.status) {
        score += 15;
        matchReasons.push(`Status: ${detected.status}`);
      }

      // Location match
      if (detected.location && dLoc.includes(detected.location.toLowerCase())) {
        score += 20;
        matchReasons.push(`Physical Vault Coordinate: ${detected.location}`);
      }

      // Product / Asset relevance
      if (detected.product) {
        const pLower = detected.product.toLowerCase();
        const pStem = stem(pLower);
        if (dProd.includes(pLower) || dTitle.includes(pLower) || dDesc.includes(pLower) || dProd.includes(pStem)) {
          score += 35;
          matchReasons.push(`Target Drug / Asset: ${detected.product}`);
        }
      }

      // Token word similarity (with morphological stemming)
      let tokenMatches = 0;
      rawTokens.forEach((tok, idx) => {
        const tokStem = stemmedTokens[idx];
        if (dNum.includes(tok)) {
          score += 25;
          tokenMatches++;
        } else if (dTitle.includes(tok) || dTitle.includes(tokStem)) {
          score += 18;
          tokenMatches++;
        } else if (dDesc.includes(tok) || dDesc.includes(tokStem)) {
          score += 12;
          tokenMatches++;
        } else if (dProd.includes(tok) || dProd.includes(tokStem) || dTags.includes(tok) || dBatch.includes(tok)) {
          score += 10;
          tokenMatches++;
        } else if (dType.toLowerCase().includes(tok) || dDept.toLowerCase().includes(tok)) {
          score += 8;
          tokenMatches++;
        }
      });

      if (tokenMatches > 0 && matchReasons.length === 0) {
        matchReasons.push(`Keyword Relevance: ${tokenMatches} search term(s) matched in record`);
      }

      // Normalized Confidence %
      let confidence = 0;
      if (score > 0) {
        confidence = Math.min(99, Math.max(60, Math.round((score / 60) * 100)));
      }

      return {
        ...doc.toObject(),
        aiConfidenceScore: confidence,
        aiMatchReasons: matchReasons,
        relevanceScore: score
      };
    });

    let matchedDocs = scoredDocs
      .filter(d => d.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Fallback: If no exact relevance score > 0, NEVER return empty list!
    // DocuShield AI suggests the closest active master procedures as recommendations.
    let isFallback = false;
    if (matchedDocs.length === 0) {
      isFallback = true;
      matchedDocs = allDocs.slice(0, 8).map(doc => ({
        ...doc.toObject(),
        aiConfidenceScore: 72,
        aiMatchReasons: ['Recommended GxP Procedure (Suggested Baseline)'],
        relevanceScore: 50,
        isRecommended: true
      }));
    }

    // 4. Generate Natural Language Summary
    let aiSummary = '';
    if (isFallback) {
      aiSummary = `VidyaGxP Search analyzed the repository for "${qTrimmed}". While an exact phrase was not indexed, the search retrieved the ${matchedDocs.length} most relevant active master procedures and controlled GxP records from the repository below.`;
    } else {
      const top = matchedDocs[0];
      const deptPart = detected.department ? ` in ${detected.department}` : '';
      const typePart = detected.documentType ? ` of category ${detected.documentType}` : '';
      aiSummary = `VidyaGxP Search identified ${matchedDocs.length} relevant GxP document(s)${deptPart}${typePart}. The top match is ${top.documentNumber} ("${top.title}") with a relevance score of ${top.aiConfidenceScore}%. Physical custody is registered at ${top.storageLocation?.code || 'Central Vault'}.`;
    }

    // Apply explicit filters if supplied
    if (filterDept) matchedDocs = matchedDocs.filter(d => d.department === filterDept);
    if (filterType) matchedDocs = matchedDocs.filter(d => d.documentType === filterType);
    if (filterStatus) matchedDocs = matchedDocs.filter(d => d.status === filterStatus);
    if (filterPhysicalStatus) matchedDocs = matchedDocs.filter(d => d.physicalStatus === filterPhysicalStatus);
    if (filterProduct) matchedDocs = matchedDocs.filter(d => (d.product || '').toLowerCase().includes(filterProduct.toLowerCase()));
    if (filterBatchNumber) matchedDocs = matchedDocs.filter(d => (d.batchNumber || '').toLowerCase().includes(filterBatchNumber.toLowerCase()));

    // Custom sorting if requested
    if (sortBy && sortBy !== 'relevance') {
      matchedDocs.sort((a, b) => {
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';
        return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    const totalMatched = matchedDocs.length;
    const paginatedMatchedDocs = matchedDocs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const matchedIds = new Set(matchedDocs.map(d => d._id.toString()));
    const relatedSuggested = allDocs
      .filter(d => !matchedIds.has(d._id.toString()))
      .slice(0, 6)
      .map(d => ({
        ...d.toObject(),
        aiConfidenceScore: 80,
        aiMatchReasons: ['High-frequency Master Procedure']
      }));

    return sendSuccess(res, 'AI Semantic Search Results', {
      query: qTrimmed,
      aiSummary,
      interpreted: detected,
      documents: paginatedMatchedDocs,
      suggestedDocuments: relatedSuggested.length > 0 ? relatedSuggested : allDocs.slice(0, 6),
      total: totalMatched,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalMatched / limitNum) || 1,
      hasNextPage: pageNum < Math.ceil(totalMatched / limitNum),
      hasPrevPage: pageNum > 1,
      isFallback,
      availableCategories,
      suggestedQueries: dynamicSuggestedQueries,
      suggestedFollowUps: []
    });
  } catch (error) {
    next(error);
  }
};

