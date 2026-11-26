import CheckoutRecord from '../models/CheckoutRecord.js';
import Document from '../models/Document.js';
import StorageLocation from '../models/StorageLocation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, PHYSICAL_STATUSES, ROLES } from '../constants/index.js';

const CHECKOUT_MANAGER_ROLES = new Set([
  'Admin',
  'admin',
  ROLES.ADMIN,
  ROLES.QA,
  ROLES.QA_MANAGER,
  ROLES.DOCUMENT_CONTROLLER
]);

const isCheckoutManagerRole = (role) => CHECKOUT_MANAGER_ROLES.has(role);

export const getCheckouts = async (req, res, next) => {
  try {
    const { status, user } = req.query;
    const now = new Date();
    const currentUserId = req.user?._id;
    const isManager = isCheckoutManagerRole(req.user?.role);

    // Build role-based visibility scope
    let scopeFilter = {};
    if (isManager) {
      if (user) {
        scopeFilter = { user };
      }
    } else {
      if (user && String(user) !== String(currentUserId)) {
        return sendSuccess(res, 'Checkout records retrieved', {
          records: [],
          counts: { checkedOut: 0, overdue: 0, returned: 0, all: 0 }
        });
      }

      if (user) {
        scopeFilter = { user: currentUserId };
      } else {
        const custodyDocs = await Document.find({ currentCustodian: currentUserId }).select('_id');
        const custodyDocIds = custodyDocs.map(d => d._id);
        scopeFilter = custodyDocIds.length > 0
          ? { $or: [{ user: currentUserId }, { document: { $in: custodyDocIds } }] }
          : { user: currentUserId };
      }
    }

    // Compute live synchronized counts within the user's authorized scope
    const scopedRecords = await CheckoutRecord.find(scopeFilter);
    let checkedOutCount = 0;
    let overdueCount = 0;
    let returnedCount = 0;

    scopedRecords.forEach(rec => {
      if (rec.status === 'Active') {
        checkedOutCount++;
        if (new Date(rec.expectedReturnDate) < now) {
          overdueCount++;
        }
      } else if (rec.status === 'Returned') {
        returnedCount++;
      }
    });

    const counts = {
      checkedOut: checkedOutCount,
      overdue: overdueCount,
      returned: returnedCount,
      all: scopedRecords.length
    };

    const statusFilter = {};
    if (status) {
      if (status === 'Checked out' || status === 'Active') {
        statusFilter.status = 'Active';
      } else if (status === 'Overdue') {
        statusFilter.status = 'Active';
        statusFilter.expectedReturnDate = { $lt: now };
      } else if (status === 'Returned') {
        statusFilter.status = 'Returned';
      }
      // 'All' or empty applies no status filter
    }

    const queryFilter = Object.keys(scopeFilter).length > 0 && Object.keys(statusFilter).length > 0
      ? { $and: [scopeFilter, statusFilter] }
      : { ...scopeFilter, ...statusFilter };

    const checkouts = await CheckoutRecord.find(queryFilter)
      .populate('document', 'documentNumber title version status physicalStatus storageLocation currentCustodian')
      .populate('user', 'name email department employeeId role')
      .populate('approvedBy', 'name email')
      .populate('returnVerifiedBy', 'name email')
      .sort({ checkoutDate: -1, createdAt: -1 });

    // Format items with status badges and exact relative days
    const processed = checkouts.map(item => {
      const obj = item.toObject();
      const exp = new Date(obj.expectedReturnDate);

      if (obj.status === 'Returned') {
        obj.isOverdue = false;
        obj.badge = {
          type: 'returned',
          label: 'Returned',
          color: 'emerald'
        };
      } else if (exp < now) {
        const diffMs = now.getTime() - exp.getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        obj.isOverdue = true;
        obj.badge = {
          type: 'overdue',
          label: `Overdue ${diffDays}d`,
          color: 'rose'
        };
      } else {
        const diffMs = exp.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        obj.isOverdue = false;
        obj.badge = {
          type: 'due',
          label: `Due in ${diffDays}d`,
          color: 'amber'
        };
      }

      return obj;
    });

    return sendSuccess(res, 'Checkout records retrieved', {
      records: processed,
      counts
    });
  } catch (error) {
    next(error);
  }
};

export const createCheckout = async (req, res, next) => {
  try {
    if (!isCheckoutManagerRole(req.user?.role)) {
      return sendError(res, `Access denied. Role '${req.user?.role}' is not authorized to issue physical check-outs.`, 403);
    }

    const { documentId, expectedReturnDate, purpose, condition = 'Good', borrowerId } = req.body;

    if (!documentId || !expectedReturnDate || !purpose) {
      return sendError(res, 'Document, expected return date, and purpose are required', 400);
    }

    const doc = await Document.findById(documentId);
    if (!doc) return sendError(res, 'Document not found', 404);

    if (doc.physicalStatus === PHYSICAL_STATUSES.CHECKED_OUT) {
      return sendError(res, `Document ${doc.documentNumber} is currently checked out`, 400);
    }

    const borrowerUser = borrowerId ? await User.findById(borrowerId) : req.user;
    if (!borrowerUser) return sendError(res, 'Borrower user not found', 404);

    const count = await CheckoutRecord.countDocuments();
    const checkoutNumber = `CHK-2026-${String(count + 1).padStart(4, '0')}`;

    const checkout = new CheckoutRecord({
      checkoutNumber,
      document: doc._id,
      user: borrowerUser._id,
      department: borrowerUser.department || req.user.department || 'General',
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
      details: `Physical checkout issued [${checkoutNumber}] for document ${doc.documentNumber} to ${borrowerUser.name}. Due on: ${new Date(expectedReturnDate).toLocaleDateString()}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const populated = await CheckoutRecord.findById(checkout._id)
      .populate('document', 'documentNumber title version status physicalStatus')
      .populate('user', 'name email department employeeId')
      .populate('approvedBy', 'name email');

    return sendSuccess(res, 'Document checked out successfully', populated, 201);
  } catch (error) {
    next(error);
  }
};

export const returnCheckout = async (req, res, next) => {
  try {
    const { conditionOnReturn = 'Good', remarks = '', binScanned } = req.body;
    const checkout = await CheckoutRecord.findById(req.params.id).populate('document').populate('user');

    if (!checkout) {
      return sendError(res, 'Checkout record not found', 404);
    }

    const isManager = isCheckoutManagerRole(req.user?.role);
    const isDocCustodian = checkout.document?.currentCustodian && String(checkout.document.currentCustodian) === String(req.user?._id);
    const isBorrower = String(checkout.user?._id || checkout.user) === String(req.user?._id);
    if (!isManager && !(req.user?.role === ROLES.CUSTODIAN && isDocCustodian && !isBorrower)) {
      return sendError(
        res,
        'Access denied. Only authorized Vault/Document Control personnel or the assigned Document Custodian may verify return.',
        403
      );
    }

    if (checkout.status === 'Returned') {
      return sendError(res, 'Document has already been recorded as returned', 400);
    }

    checkout.status = 'Returned';
    checkout.actualReturnDate = new Date();
    checkout.conditionOnReturn = conditionOnReturn;
    checkout.returnVerifiedBy = req.user._id;
    checkout.remarks = remarks || (binScanned ? `Verified by bin QR scan (${binScanned})` : 'Verified return into secure vault');
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
      details: `Document ${checkout.document?.documentNumber || ''} returned by ${checkout.user?.name} and verified (${conditionOnReturn}) by ${req.user.name}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Document return successfully processed and verified', checkout);
  } catch (error) {
    next(error);
  }
};

export const remindCheckout = async (req, res, next) => {
  try {
    if (!isCheckoutManagerRole(req.user?.role)) {
      return sendError(res, `Access denied. Role '${req.user?.role}' is not authorized to send overdue reminders.`, 403);
    }

    const checkout = await CheckoutRecord.findById(req.params.id)
      .populate('document')
      .populate('user');

    if (!checkout) {
      return sendError(res, 'Checkout record not found', 404);
    }

    if (checkout.status === 'Returned') {
      return sendError(res, 'Cannot send reminder for an already returned document', 400);
    }

    if (String(checkout.user?._id || checkout.user) === String(req.user?._id)) {
      return sendError(res, 'Cannot send an overdue compliance reminder to yourself', 400);
    }

    const borrower = checkout.user;
    const docNum = checkout.document?.documentNumber || 'Physical Document';
    const dueDate = checkout.expectedReturnDate ? new Date(checkout.expectedReturnDate).toLocaleDateString() : 'N/A';

    // Increment dynamic reminder count and update timestamp
    checkout.lastReminderSentAt = new Date();
    checkout.reminderCount = (checkout.reminderCount || 0) + 1;
    await checkout.save();

    // 1. Deliver GxP compliance alert notification to the borrower in MongoDB
    await Notification.create({
      recipient: borrower._id,
      title: `Overdue Physical Document Notice: ${docNum}`,
      message: `Urgent GxP Notice: Physical binder ${docNum} borrowed on ${new Date(checkout.checkoutDate).toLocaleDateString()} was due on ${dueDate}. Please return it to the vault or contact Document Control immediately.`,
      type: 'warning',
      link: '/physical/checkout'
    });

    // 2. Deliver confirmation notification to the dispatching user if different
    if (req.user && String(req.user._id) !== String(borrower._id)) {
      await Notification.create({
        recipient: req.user._id,
        title: `Reminder Sent: ${docNum}`,
        message: `Overdue return reminder #${checkout.reminderCount} was successfully dispatched to ${borrower.name} (${borrower.department || 'Operations'}) for document ${docNum}.`,
        type: 'info',
        link: '/physical/checkout'
      });
    }

    // 3. Write immutable 21 CFR Part 11 audit trail
    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.REMINDER || AUDIT_ACTIONS.CHECKOUT,
      entity: 'CheckoutRecord',
      entityId: checkout._id,
      details: `Compliance reminder notification #${checkout.reminderCount} triggered for overdue document ${docNum} to borrower ${borrower.name}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, `Reminder successfully delivered to ${borrower.name}`, {
      borrowerName: borrower.name,
      documentNumber: docNum,
      reminderCount: checkout.reminderCount,
      lastReminderSentAt: checkout.lastReminderSentAt
    });
  } catch (error) {
    next(error);
  }
};
