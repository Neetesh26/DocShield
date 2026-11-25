import Handover from '../models/Handover.js';
import Document from '../models/Document.js';
import Approval from '../models/Approval.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/index.js';

export const getHandovers = async (req, res, next) => {
  try {
    const { status, myOnly } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (myOnly === 'true') {
      filter.$or = [
        { previousCustodian: req.user._id },
        { newCustodian: req.user._id },
        { initiatedBy: req.user._id }
      ];
    }

    const handovers = await Handover.find(filter)
      .populate('documents', 'documentNumber title version status storageLocation')
      .populate('previousCustodian', 'name email department employeeId')
      .populate('newCustodian', 'name email department employeeId')
      .populate('initiatedBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Handovers retrieved', handovers);
  } catch (error) {
    next(error);
  }
};

export const createHandover = async (req, res, next) => {
  try {
    const { documentIds, newCustodianId, reason, remarks = '' } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0 || !newCustodianId || !reason) {
      return sendError(res, 'Document list, new custodian, and reason are required', 400);
    }

    // Verify documents exist
    const docs = await Document.find({ _id: { $in: documentIds } });
    if (docs.length === 0) {
      return sendError(res, 'No valid documents found for handover', 404);
    }

    const previousCustodianId = docs[0].currentCustodian || req.user._id;

    const count = await Handover.countDocuments();
    const handoverNumber = `HND-2026-${String(count + 1).padStart(4, '0')}`;

    const handover = new Handover({
      handoverNumber,
      documents: docs.map(d => d._id),
      previousCustodian: previousCustodianId,
      newCustodian: newCustodianId,
      initiatedBy: req.user._id,
      reason,
      remarks,
      status: 'Pending Acceptance'
    });

    await handover.save();

    // Create synchronized Approval entry for 21 CFR Part 11 Approval Cockpit
    const approval = new Approval({
      handover: handover._id,
      document: docs[0]._id,
      type: 'Custody Transfer',
      approver: newCustodianId,
      status: 'Pending',
      comments: `Custody Transfer ${handoverNumber} initiated by ${req.user.name}. Reason: ${reason}`
    });
    await approval.save();

    // Send notification to the new custodian
    await Notification.create({
      recipient: newCustodianId,
      title: `Custody Handover Pending: ${handoverNumber}`,
      message: `${req.user.name} initiated custody transfer of ${docs.length} document(s) to you. Reason: ${reason}`,
      type: 'info',
      link: '/physical/custody'
    });

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.HANDOVER,
      entity: 'Handover',
      entityId: handover._id,
      details: `Initiated custody transfer [${handoverNumber}] for ${docs.length} document(s).`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Handover initiated successfully', handover, 201);
  } catch (error) {
    next(error);
  }
};

export const acceptHandover = async (req, res, next) => {
  try {
    const handover = await Handover.findById(req.params.id).populate('documents');
    if (!handover) return sendError(res, 'Handover record not found', 404);

    if (handover.status !== 'Pending Acceptance') {
      return sendError(res, `Cannot accept handover in '${handover.status}' state`, 400);
    }

    const isNewCustodian = String(handover.newCustodian) === String(req.user._id);
    const isAdminOrQA = req.user.role === 'Admin' || req.user.role === 'QA' || req.user.role === 'QA Manager';

    if (!isNewCustodian && !isAdminOrQA) {
      return sendError(res, 'Only the designated new custodian (or authorized Admin/QA) can accept this handover', 403);
    }

    const { remarks = '' } = req.body;

    handover.status = 'Accepted';
    handover.acceptedDate = new Date();
    if (remarks) {
      handover.remarks = handover.remarks ? `${handover.remarks} | ${remarks}` : remarks;
    }
    await handover.save();

    // Synchronize linked Approval record if exists
    await Approval.updateMany(
      { handover: handover._id, status: 'Pending' },
      {
        status: 'Approved',
        actionDate: new Date(),
        electronicSignature: {
          signedBy: `${req.user.name} (${req.user.employeeId || req.user.email})`,
          signedAt: new Date(),
          meaning: 'I accept custody of this record in compliance with 21 CFR Part 11 requirements.'
        }
      }
    );

    // Update currentCustodian on all related documents
    await Document.updateMany(
      { _id: { $in: handover.documents } },
      { currentCustodian: handover.newCustodian }
    );

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.HANDOVER,
      entity: 'Handover',
      entityId: handover._id,
      details: `Custody handover [${handover.handoverNumber}] accepted by ${req.user.name}. Custody transferred.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Custody successfully transferred and accepted', handover);
  } catch (error) {
    next(error);
  }
};

export const rejectHandover = async (req, res, next) => {
  try {
    const { reason = 'Rejected by designated receiver' } = req.body;
    const handover = await Handover.findById(req.params.id);
    if (!handover) return sendError(res, 'Handover record not found', 404);

    if (handover.status !== 'Pending Acceptance') {
      return sendError(res, `Cannot reject handover in '${handover.status}' state`, 400);
    }

    handover.status = 'Rejected';
    handover.rejectedDate = new Date();
    handover.rejectionReason = reason;
    await handover.save();

    // Synchronize linked Approval record if exists
    await Approval.updateMany(
      { handover: handover._id, status: 'Pending' },
      { status: 'Rejected', actionDate: new Date(), comments: reason }
    );

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.HANDOVER,
      entity: 'Handover',
      entityId: handover._id,
      details: `Custody handover [${handover.handoverNumber}] rejected by ${req.user.name}. Reason: ${reason}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Handover transfer rejected', handover);
  } catch (error) {
    next(error);
  }
};

