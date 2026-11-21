import CheckoutRecord from '../models/CheckoutRecord.js';
import Document from '../models/Document.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, PHYSICAL_STATUSES } from '../constants/index.js';

export const getCheckouts = async (req, res, next) => {
  try {
    const { status, user, search } = req.query;
    const filter = {};

    if (status) {
      if (status === 'Overdue') {
        filter.status = 'Active';
        filter.expectedReturnDate = { $lt: new Date() };
      } else {
        filter.status = status;
      }
    }
    if (user) filter.user = user;

    const checkouts = await CheckoutRecord.find(filter)
      .populate('document', 'documentNumber title version status physicalStatus storageLocation')
      .populate('user', 'name email department employeeId')
      .populate('approvedBy', 'name email')
      .populate('returnVerifiedBy', 'name email')
      .sort({ createdAt: -1 });

    // Mark any active item past expected return date as Overdue for frontend display
    const processed = checkouts.map(item => {
      const obj = item.toObject();
      if (obj.status === 'Active' && new Date(obj.expectedReturnDate) < new Date()) {
        obj.isOverdue = true;
      } else {
        obj.isOverdue = false;
      }
      return obj;
    });

    return sendSuccess(res, 'Checkout records retrieved', processed);
  } catch (error) {
    next(error);
  }
};

export const createCheckout = async (req, res, next) => {
  try {
    const { documentId, expectedReturnDate, purpose, condition = 'Good' } = req.body;

    if (!documentId || !expectedReturnDate || !purpose) {
      return sendError(res, 'Document ID, expected return date, and checkout purpose are required', 400);
    }

    const doc = await Document.findById(documentId);
    if (!doc) return sendError(res, 'Document not found', 404);

    if (doc.physicalStatus === PHYSICAL_STATUSES.CHECKED_OUT) {
      return sendError(res, 'Document is already checked out by another user', 400);
    }

    const count = await CheckoutRecord.countDocuments();
    const checkoutNumber = `CHK-2026-${String(count + 1).padStart(4, '0')}`;

    const checkout = new CheckoutRecord({
      checkoutNumber,
      document: doc._id,
      user: req.user._id,
      department: req.user.department,
      purpose,
      checkoutDate: new Date(),
      expectedReturnDate: new Date(expectedReturnDate),
      status: 'Active',
      approvedBy: req.user._id,
      conditionOnCheckout: condition
    });

    await checkout.save();

    // Mark Document as Checked Out
    doc.physicalStatus = PHYSICAL_STATUSES.CHECKED_OUT;
    await doc.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.CHECKOUT,
      entity: 'CheckoutRecord',
      entityId: checkout._id,
      details: `Physical checkout issued [${checkoutNumber}] for document ${doc.documentNumber}. Expected return: ${new Date(expectedReturnDate).toLocaleDateString()}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Document checked out successfully', checkout, 201);
  } catch (error) {
    next(error);
  }
};

export const returnCheckout = async (req, res, next) => {
  try {
    const { conditionOnReturn = 'Good', remarks = '' } = req.body;
    const checkout = await CheckoutRecord.findById(req.params.id).populate('document');

    if (!checkout) {
      return sendError(res, 'Checkout record not found', 404);
    }

    if (checkout.status === 'Returned') {
      return sendError(res, 'Document has already been recorded as returned', 400);
    }

    checkout.status = 'Returned';
    checkout.actualReturnDate = new Date();
    checkout.conditionOnReturn = conditionOnReturn;
    checkout.returnVerifiedBy = req.user._id;
    checkout.remarks = remarks;
    await checkout.save();

    // Update document physical status back to Stored
    if (checkout.document) {
      await Document.findByIdAndUpdate(checkout.document._id, {
        physicalStatus: PHYSICAL_STATUSES.STORED
      });
    }

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.RETURN,
      entity: 'CheckoutRecord',
      entityId: checkout._id,
      details: `Document ${checkout.document?.documentNumber || ''} returned and inspected (${conditionOnReturn}) by ${req.user.name}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Document return successfully processed and verified', checkout);
  } catch (error) {
    next(error);
  }
};

