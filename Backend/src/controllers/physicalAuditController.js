import PhysicalAudit from '../models/PhysicalAudit.js';
import Document from '../models/Document.js';
import StorageLocation from '../models/StorageLocation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/index.js';

export const getAudits = async (req, res, next) => {
  try {
    const { status, locationId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (locationId) filter.storageLocation = locationId;

    const audits = await PhysicalAudit.find(filter)
      .populate('auditor', 'name email department employeeId')
      .populate('storageLocation')
      .populate('items.document', 'documentNumber title version status')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Physical audits retrieved', audits);
  } catch (error) {
    next(error);
  }
};

export const getAuditById = async (req, res, next) => {
  try {
    const audit = await PhysicalAudit.findById(req.params.id)
      .populate('auditor', 'name email department employeeId')
      .populate('storageLocation')
      .populate('items.document', 'documentNumber title version status physicalStatus currentCustodian fileNumber boxNumber');

    if (!audit) return sendError(res, 'Audit not found', 404);

    return sendSuccess(res, 'Audit details retrieved', audit);
  } catch (error) {
    next(error);
  }
};

export const createAudit = async (req, res, next) => {
  try {
    const { title, scheduledDate, storageLocationId, notes = '' } = req.body;

    if (!title || !scheduledDate || !storageLocationId) {
      return sendError(res, 'Audit title, scheduled date, and target storage location are required', 400);
    }

    const loc = await StorageLocation.findById(storageLocationId);
    if (!loc) return sendError(res, 'Target storage location not found', 404);

    // Find all documents expected to be stored in this location
    const expectedDocs = await Document.find({ storageLocation: loc._id });

    const auditItems = expectedDocs.map(doc => ({
      document: doc._id,
      expectedLocation: loc.code,
      actualLocation: '',
      status: 'Pending',
      qrVerified: false,
      condition: 'Not Assessed',
      notes: ''
    }));

    const count = await PhysicalAudit.countDocuments();
    const auditNumber = `AUD-2026-${String(count + 1).padStart(4, '0')}`;

    const audit = new PhysicalAudit({
      auditNumber,
      title,
      scheduledDate: new Date(scheduledDate),
      auditor: req.user._id,
      storageLocation: loc._id,
      status: 'Scheduled',
      summary: {
        expectedCount: auditItems.length,
        foundCount: 0,
        missingCount: 0,
        misplacedCount: 0
      },
      items: auditItems,
      findings: notes
    });

    await audit.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.PHYSICAL_AUDIT,
      entity: 'PhysicalAudit',
      entityId: audit._id,
      details: `Scheduled physical inventory audit [${auditNumber}] at location ${loc.code} with ${auditItems.length} expected records.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Physical audit scheduled successfully', audit, 201);
  } catch (error) {
    next(error);
  }
};

export const verifyAuditItem = async (req, res, next) => {
  try {
    const { itemId, status, qrVerified = false, condition = 'Good', actualLocation = '', notes = '' } = req.body;
    const audit = await PhysicalAudit.findById(req.params.id);

    if (!audit) return sendError(res, 'Audit not found', 404);

    const item = audit.items.id(itemId);
    if (!item) return sendError(res, 'Audit item not found', 404);

    item.status = status || item.status;
    item.qrVerified = qrVerified;
    item.condition = condition;
    item.actualLocation = actualLocation || item.expectedLocation;
    item.notes = notes;

    // Recalculate summary
    let found = 0;
    let missing = 0;
    let misplaced = 0;

    audit.items.forEach(it => {
      if (it.status === 'Found') found++;
      else if (it.status === 'Missing') missing++;
      else if (it.status === 'Misplaced') misplaced++;
    });

    audit.summary.foundCount = found;
    audit.summary.missingCount = missing;
    audit.summary.misplacedCount = misplaced;
    audit.status = 'In Progress';

    await audit.save();

    return sendSuccess(res, 'Audit item reconciled', audit);
  } catch (error) {
    next(error);
  }
};

export const completeAudit = async (req, res, next) => {
  try {
    const { findings = '', correctiveActions = '' } = req.body;
    const audit = await PhysicalAudit.findById(req.params.id).populate('storageLocation');

    if (!audit) return sendError(res, 'Audit not found', 404);

    const hasDiscrepancy = audit.summary.missingCount > 0 || audit.summary.misplacedCount > 0;
    audit.status = hasDiscrepancy ? 'Discrepancy Found' : 'Completed';
    audit.conductedDate = new Date();
    audit.findings = findings;
    audit.correctiveActions = correctiveActions;
    audit.signOff = {
      signedBy: `${req.user.name} (${req.user.role})`,
      signedAt: new Date()
    };

    await audit.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.PHYSICAL_AUDIT,
      entity: 'PhysicalAudit',
      entityId: audit._id,
      details: `Completed physical audit ${audit.auditNumber} at ${audit.storageLocation?.code}. Found: ${audit.summary.foundCount}, Missing: ${audit.summary.missingCount}, Misplaced: ${audit.summary.misplacedCount}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Physical audit signed off and finalized', audit);
  } catch (error) {
    next(error);
  }
};

