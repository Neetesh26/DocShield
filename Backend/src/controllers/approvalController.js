import Approval from '../models/Approval.js';
import DocumentRequest from '../models/DocumentRequest.js';
import Notification from '../models/Notification.js';
import CheckoutRecord from '../models/CheckoutRecord.js';
import Document from '../models/Document.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, REQUEST_STATUSES, PHYSICAL_STATUSES } from '../constants/index.js';

export const getApprovals = async (req, res, next) => {
  try {
    const { status = 'Pending', type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const approvals = await Approval.find(filter)
      .populate({
        path: 'request',
        populate: { path: 'requester', select: 'name email department employeeId' }
      })
      .populate('document', 'documentNumber title version status physicalStatus department')
      .populate('approver', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Approvals list retrieved', approvals);
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const { comments = '', signatureMeaning = 'I approve this record in compliance with 21 CFR Part 11 requirements.' } = req.body;
    const approval = await Approval.findById(req.params.id)
      .populate('request')
      .populate('document');

    if (!approval) {
      return sendError(res, 'Approval record not found', 404);
    }

    if (approval.status !== 'Pending') {
      return sendError(res, `Cannot approve: Item is already ${approval.status}`, 400);
    }

    approval.status = 'Approved';
    approval.approver = req.user._id;
    approval.comments = comments;
    approval.actionDate = new Date();
    approval.electronicSignature = {
      signedBy: `${req.user.name} (${req.user.employeeId})`,
      signedAt: new Date(),
      meaning: signatureMeaning
    };
    await approval.save();

    // If attached to a DocumentRequest, update the request status
    if (approval.request) {
      const request = await DocumentRequest.findById(approval.request._id);
      if (request) {
        request.status = REQUEST_STATUSES.APPROVED;
        request.approvedBy = req.user._id;
        request.approvalDate = new Date();
        request.remarks = comments;
        await request.save();

        // If it was a Checkout request, create an active checkout record automatically
        if (request.requestType === 'Checkout') {
          const count = await CheckoutRecord.countDocuments();
          const checkoutNumber = `CHK-2026-${String(count + 1).padStart(4, '0')}`;
          const checkout = new CheckoutRecord({
            checkoutNumber,
            document: request.document,
            user: request.requester,
            department: request.department,
            purpose: request.purpose || request.reason,
            checkoutDate: new Date(),
            expectedReturnDate: request.expectedReturnDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'Active',
            approvedBy: req.user._id,
            conditionOnCheckout: 'Good'
          });
          await checkout.save();

          // Update Document physical status
          await Document.findByIdAndUpdate(request.document, {
            physicalStatus: PHYSICAL_STATUSES.CHECKED_OUT
          });
        }

        // Notify requester
        await Notification.create({
          recipient: request.requester,
          title: `Request ${request.requestNumber} Approved`,
          message: `Your ${request.requestType} request for ${approval.document?.documentNumber || 'document'} was approved by ${req.user.name}.`,
          type: 'success',
          link: '/workflow/requests'
        });
      }
    }

    // Log GxP Audit event
    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.APPROVE,
      entity: 'Approval',
      entityId: approval._id,
      details: `Approved ${approval.type} for document ${approval.document?.documentNumber}. Comments: ${comments}`,
      metadata: { approvalId: approval._id, signatureMeaning },
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Request approved successfully', approval);
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { comments = 'Rejected by QA review' } = req.body;
    const approval = await Approval.findById(req.params.id)
      .populate('request')
      .populate('document');

    if (!approval) {
      return sendError(res, 'Approval record not found', 404);
    }

    if (approval.status !== 'Pending') {
      return sendError(res, `Cannot reject: Item is already ${approval.status}`, 400);
    }

    approval.status = 'Rejected';
    approval.approver = req.user._id;
    approval.comments = comments;
    approval.actionDate = new Date();
    await approval.save();

    if (approval.request) {
      const request = await DocumentRequest.findById(approval.request._id);
      if (request) {
        request.status = REQUEST_STATUSES.REJECTED;
        request.rejectionReason = comments;
        await request.save();

        await Notification.create({
          recipient: request.requester,
          title: `Request ${request.requestNumber} Rejected`,
          message: `Your ${request.requestType} request for ${approval.document?.documentNumber || 'document'} was rejected: ${comments}`,
          type: 'alert',
          link: '/workflow/requests'
        });
      }
    }

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.REJECT,
      entity: 'Approval',
      entityId: approval._id,
      details: `Rejected ${approval.type} for document ${approval.document?.documentNumber}. Reason: ${comments}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Request rejected', approval);
  } catch (error) {
    next(error);
  }
};

