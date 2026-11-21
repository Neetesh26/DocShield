import crypto from 'crypto';
import fs from 'fs';
import Document from '../models/Document.js';
import DocumentVersion from '../models/DocumentVersion.js';
import StorageLocation from '../models/StorageLocation.js';
import DocumentRequest from '../models/DocumentRequest.js';
import AuditLog from '../models/AuditLog.js';
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
      qrCodeData: `DOCUSHIELD:${documentNumber}`,
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
 * Get Documents with Search, Filters, Sorting, and Pagination
 */
export const getDocuments = async (req, res, next) => {
  try {
    const {
      search,
      status,
      department,
      documentType,
      physicalStatus,
      product,
      batchNumber,
      custodian,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { documentNumber: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { product: new RegExp(search, 'i') },
        { batchNumber: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (documentType) filter.documentType = documentType;
    if (physicalStatus) filter.physicalStatus = physicalStatus;
    if (product) filter.product = new RegExp(product, 'i');
    if (batchNumber) filter.batchNumber = new RegExp(batchNumber, 'i');
    if (custodian) filter.currentCustodian = custodian;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [documents, totalCount] = await Promise.all([
      Document.find(filter)
        .populate('currentCustodian', 'name email department')
        .populate('storageLocation')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Document.countDocuments(filter)
    ]);

    return sendSuccess(res, 'Documents retrieved successfully', documents, 200, {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
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

