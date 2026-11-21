import DocumentRequest from '../models/DocumentRequest.js';
import Approval from '../models/Approval.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, REQUEST_STATUSES, ROLES } from '../constants/index.js';

export const createRequest = async (req, res, next) => {
  try {
    const {
      documentId,
      requestType,
      reason,
      purpose = 'Operational Reference',
      urgency = 'Normal',
      copiesRequested = 1,
      expectedReturnDate = null,
      remarks = ''
    } = req.body;

    if (!documentId || !requestType || !reason) {
      return sendError(res, 'Document ID, request type, and justification reason are mandatory', 400);
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return sendError(res, 'Document not found', 404);
    }

    // Auto-generate Request Number
    const count = await DocumentRequest.countDocuments();
    const requestNumber = `REQ-2026-${String(count + 1).padStart(4, '0')}`;

    const newRequest = new DocumentRequest({
      requestNumber,
      requestType,
      document: doc._id,
      requester: req.user._id,
      department: req.user.department || doc.department,
      reason,
      purpose,
      urgency,
      copiesRequested: Number(copiesRequested) || 1,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      remarks,
      status: REQUEST_STATUSES.PENDING
    });

    await newRequest.save();

    // Create an associated Approval task for QA / Doc Controller
    const approval = new Approval({
      request: newRequest._id,
      document: doc._id,
      type: `${requestType} Request`,
      approver: req.user._id, // Will be acted on by authorized QA
      status: 'Pending',
      comments: `Request ${requestNumber} submitted by ${req.user.name}`
    });
    await approval.save();

    // Notify QA Users
    const qaUsers = await User.find({ role: { $in: [ROLES.QA, ROLES.DOCUMENT_CONTROLLER, ROLES.ADMIN] } }).limit(5);
    for (const qa of qaUsers) {
      await Notification.create({
        recipient: qa._id,
        title: `New ${requestType} Request: ${requestNumber}`,
        message: `${req.user.name} requested ${requestType} for ${doc.documentNumber} (${doc.title}).`,
        type: urgency === 'Urgent' ? 'warning' : 'info',
        link: `/workflow/approvals`
      });
    }

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.UPLOAD,
      entity: 'DocumentRequest',
      entityId: newRequest._id,
      details: `Created ${requestType} request [${requestNumber}] for document ${doc.documentNumber}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const populated = await DocumentRequest.findById(newRequest._id)
      .populate('document', 'documentNumber title version status')
      .populate('requester', 'name email department');

    return sendSuccess(res, 'Request created and submitted for QA approval', populated, 201);
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const { status, type, documentId, myOnly } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.requestType = type;
    if (documentId) filter.document = documentId;
    if (myOnly === 'true') filter.requester = req.user._id;

    const requests = await DocumentRequest.find(filter)
      .populate('document', 'documentNumber title version status physicalStatus')
      .populate('requester', 'name email department employeeId')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Requests retrieved', requests);
  } catch (error) {
    next(error);
  }
};

export const getRequestById = async (req, res, next) => {
  try {
    const request = await DocumentRequest.findById(req.params.id)
      .populate('document')
      .populate('requester', 'name email department employeeId')
      .populate('approvedBy', 'name email role');

    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    return sendSuccess(res, 'Request details retrieved', request);
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req, res, next) => {
  try {
    const request = await DocumentRequest.findById(req.params.id);
    if (!request) return sendError(res, 'Request not found', 404);

    if (String(request.requester) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 'Only the original requester or Administrator can cancel this request', 403);
    }

    if (request.status !== REQUEST_STATUSES.PENDING) {
      return sendError(res, `Cannot cancel request in '${request.status}' state`, 400);
    }

    request.status = REQUEST_STATUSES.CANCELLED;
    await request.save();

    await Approval.updateMany({ request: request._id }, { status: 'Rejected', comments: 'Cancelled by requester' });

    return sendSuccess(res, 'Request cancelled successfully', request);
  } catch (error) {
    next(error);
  }
};

