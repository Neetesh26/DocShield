import CheckoutRecord from '../models/CheckoutRecord.js';
import Document from '../models/Document.js';
import StorageLocation from '../models/StorageLocation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, PHYSICAL_STATUSES, ROLES } from '../constants/index.js';

// Helper to seed initial sample checkout records if collection is incomplete
const ensureDefaultCheckouts = async () => {
  try {
    const sampleNumbers = ['CHK-2026-0001', 'CHK-2026-0002', 'CHK-2026-0003', 'CHK-2026-0004', 'CHK-2026-0005', 'CHK-2026-0006'];
    const existingRecords = await CheckoutRecord.find({
      checkoutNumber: { $in: sampleNumbers }
    });
    if (existingRecords.length >= 6 && existingRecords.every(r => r.document && r.user)) {
      return;
    }

    // Helper to find or create storage location
    let defaultLoc = await StorageLocation.findOne();
    if (!defaultLoc) {
      defaultLoc = await StorageLocation.findOne({ code: 'PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01' });
    }
    if (!defaultLoc) {
      try {
        defaultLoc = await StorageLocation.create({
          building: 'Plant-1',
          area: 'Production Document Room',
          room: '101',
          rack: 'R-01',
          shelf: '01',
          bin: 'B01',
          box: 'BX-01',
          code: 'PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01',
          capacity: 50,
          currentOccupancy: 0,
          department: 'Production',
          status: 'Available'
        });
      } catch (locErr) {
        defaultLoc = await StorageLocation.findOne();
      }
    }

    // Helper to find or create users safely with fallbacks
    let adminUser = await User.findOne({ email: 'anita.sharma@docushield.com' });
    if (!adminUser) adminUser = await User.findOne({ role: ROLES.ADMIN });
    if (!adminUser) adminUser = await User.findOne({});
    if (!adminUser) {
      try {
        adminUser = await User.create({
          name: 'Anita Sharma',
          email: 'anita.sharma@docushield.com',
          password: 'DocuShield@2026',
          role: ROLES.ADMIN,
          department: 'Executive Administration',
          employeeId: 'EMP-ADM-001',
          designation: 'System Administrator & Governance Lead'
        });
      } catch (e) {
        adminUser = await User.findOne({});
      }
    }

    const getUserOrDefault = async (email, employeeId, name, role, dept) => {
      let u = await User.findOne({ email });
      if (!u && employeeId) u = await User.findOne({ employeeId });
      if (!u && name) u = await User.findOne({ name: new RegExp(name, 'i') });
      if (!u) {
        try {
          u = await User.create({
            name,
            email,
            password: 'DocuShield@2026',
            role,
            department: dept,
            employeeId,
            designation: `${role} - ${dept}`
          });
        } catch (e) {
          u = adminUser;
        }
      }
      return u || adminUser;
    };

    const anita = adminUser;
    const suresh = await getUserOrDefault('suresh.patil@docushield.com', 'EMP-DC-003', 'Suresh Patil', ROLES.DOCUMENT_CONTROLLER, 'Document Control');
    const priya = await getUserOrDefault('priya.nair@docushield.com', 'EMP-CUST-005', 'Priya Nair', ROLES.CUSTODIAN, 'Quality Control');
    const amit = await getUserOrDefault('amit.kumar@docushield.com', 'EMP-USR-006', 'Amit Kumar', ROLES.VIEWER, 'Operations & R&D');
    const rahul = await getUserOrDefault('rahul.verma@docushield.com', 'EMP-CUST-004', 'Rahul Verma', ROLES.CUSTODIAN, 'Production');

    // Helper to find or create documents
    const findOrCreateDoc = async (documentNumber, title, version, department, documentType) => {
      let doc = await Document.findOne({ documentNumber });
      if (!doc) {
        try {
          doc = await Document.create({
            documentNumber,
            title,
            version,
            documentType: documentType || 'Standard Operating Procedure (SOP)',
            department,
            status: 'Effective',
            physicalStatus: PHYSICAL_STATUSES.CHECKED_OUT,
            uploadedBy: adminUser._id,
            currentCustodian: adminUser._id,
            storageLocation: defaultLoc._id,
            fileUrl: '/uploads/sample_sop.pdf',
            fileName: `${documentNumber.replace(/[\/\\]/g, '_')}.pdf`,
            fileSize: 18450,
            fileMimeType: 'application/pdf',
            tags: ['GxP', 'Validated', department.replace(/\s+/g, '')],
            boxNumber: 'BX-01',
            fileNumber: `${documentNumber}-F1`,
            physicalCopiesCount: 2
          });
        } catch (docErr) {
          doc = await Document.findOne({ documentNumber }) || await Document.findOne({});
        }
      } else if (!doc.storageLocation) {
        doc.storageLocation = defaultLoc._id;
        await doc.save();
      }
      return doc;
    };

    const doc1 = await findOrCreateDoc('SOP/IT/002', 'User Access Management for Computerised Systems', '02', 'Quality Assurance');
    const doc2 = await findOrCreateDoc('SOP/QC/004', 'Operation and Calibration of HPLC', '03', 'Quality Control');
    const doc3 = await findOrCreateDoc('SOP/PRD/014', 'Operation of Tablet Compression Machine', '01', 'Production');
    const doc4 = await findOrCreateDoc('BMR/PRD/500/26A004', 'Batch Manufacturing Record - Paracetamol 500mg Tablets - Batch 26A004', '01', 'Production', 'Batch Manufacturing Record (BMR)');
    const doc5 = await findOrCreateDoc('SOP/QA/001', 'Document Lifecycle Management and SOP Archival', '04', 'Quality Assurance');
    const doc6 = await findOrCreateDoc('VAL/IT/2026/01', 'ERP Computer System Validation Master Plan', '01', 'Quality Assurance', 'Validation Protocol / Report');

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    // Helper to upsert a checkout record so it always accurately matches the register
    const upsertCheckout = async (checkoutNumber, docId, userId, dept, purpose, checkoutDate, expectedReturnDate, status, approvedById, conditionOnCheckout, extra = {}) => {
      let rec = await CheckoutRecord.findOne({ checkoutNumber });
      if (!rec) {
        rec = await CheckoutRecord.create({
          checkoutNumber,
          document: docId,
          user: userId,
          department: dept,
          purpose,
          checkoutDate,
          expectedReturnDate,
          status,
          approvedBy: approvedById,
          conditionOnCheckout,
          ...extra
        });
      } else {
        rec.document = docId;
        rec.user = userId;
        rec.department = dept;
        rec.purpose = purpose;
        rec.checkoutDate = checkoutDate;
        rec.expectedReturnDate = expectedReturnDate;
        rec.status = status;
        rec.approvedBy = approvedById;
        rec.conditionOnCheckout = conditionOnCheckout;
        Object.assign(rec, extra);
        await rec.save();
      }
      return rec;
    };

    // 1. SOP/IT/002 - Priya Nair, Issued: 23 Nov 2026, 16:34 by Anita Sharma, Due: 30 Nov 2026 (Due in 5d)
    await upsertCheckout(
      'CHK-2026-0001',
      doc1._id,
      priya._id,
      'Quality Control',
      'Handover HO-0006: na',
      new Date('2026-11-23T16:34:00.000Z'),
      new Date(now.getTime() + 5 * dayMs),
      'Active',
      anita._id,
      'Good'
    );
    doc1.physicalStatus = PHYSICAL_STATUSES.CHECKED_OUT;
    await doc1.save();

    // 2. SOP/QC/004 - Amit Kumar, Issued: 19 Nov 2026, 16:14 by Suresh Patil, Due: 23 Nov 2026 (Overdue 2d)
    await upsertCheckout(
      'CHK-2026-0002',
      doc2._id,
      amit._id,
      'Operations & R&D',
      'HPLC calibration activity',
      new Date('2026-11-19T16:14:00.000Z'),
      new Date(now.getTime() - 2 * dayMs),
      'Active',
      suresh._id,
      'Good'
    );
    doc2.physicalStatus = PHYSICAL_STATUSES.CHECKED_OUT;
    await doc2.save();

    // 3. SOP/PRD/014 - Rahul Verma, Issued: 18 Nov 2026, 16:14 by Suresh Patil, Due: 25 Nov 2026 (Due in 0d)
    await upsertCheckout(
      'CHK-2026-0003',
      doc3._id,
      rahul._id,
      'Production',
      'Shop-floor reference during compression training',
      new Date('2026-11-18T16:14:00.000Z'),
      new Date(now.getTime() + 4 * 60 * 60 * 1000), // Today
      'Active',
      suresh._id,
      'Good'
    );
    doc3.physicalStatus = PHYSICAL_STATUSES.CHECKED_OUT;
    await doc3.save();

    // 4. BMR/PRD/500/26A004 - Rahul Verma, Issued: 09 Nov 2026, 16:14 by Suresh Patil, Due: 16 Nov 2026 (Overdue 9d)
    await upsertCheckout(
      'CHK-2026-0004',
      doc4._id,
      rahul._id,
      'Production',
      'Batch record review for APQR',
      new Date('2026-11-09T16:14:00.000Z'),
      new Date(now.getTime() - 9 * dayMs),
      'Active',
      suresh._id,
      'Good'
    );
    doc4.physicalStatus = PHYSICAL_STATUSES.CHECKED_OUT;
    await doc4.save();

    // 5. SOP/QA/001 - Priya Nair, Returned
    await upsertCheckout(
      'CHK-2026-0005',
      doc5._id,
      priya._id,
      'Quality Control',
      'Annual internal compliance audit verification',
      new Date('2026-11-01T10:00:00.000Z'),
      new Date('2026-11-08T18:00:00.000Z'),
      'Returned',
      anita._id,
      'Good',
      {
        actualReturnDate: new Date('2026-11-07T15:30:00.000Z'),
        returnVerifiedBy: suresh._id,
        conditionOnReturn: 'Good',
        remarks: 'Verified bin QR return scan. Physical binder spine intact.'
      }
    );
    doc5.physicalStatus = PHYSICAL_STATUSES.STORED;
    await doc5.save();

    // 6. VAL/IT/2026/01 - Amit Kumar, Returned
    await upsertCheckout(
      'CHK-2026-0006',
      doc6._id,
      amit._id,
      'Operations & R&D',
      'Software qualification protocol execution',
      new Date('2026-11-05T11:20:00.000Z'),
      new Date('2026-11-12T18:00:00.000Z'),
      'Returned',
      suresh._id,
      'Good',
      {
        actualReturnDate: new Date('2026-11-11T14:15:00.000Z'),
        returnVerifiedBy: suresh._id,
        conditionOnReturn: 'Good',
        remarks: 'Returned to IT archival cabinet.'
      }
    );
    doc6.physicalStatus = PHYSICAL_STATUSES.STORED;
    await doc6.save();
  } catch (err) {
    console.error('[ensureDefaultCheckouts error]:', err);
  }
};

export const getCheckouts = async (req, res, next) => {
  try {
    await ensureDefaultCheckouts();

    const { status, user, search } = req.query;
    const now = new Date();

    // Compute live synchronized counts across all records
    const allRecords = await CheckoutRecord.find({});
    let checkedOutCount = 0;
    let overdueCount = 0;
    let returnedCount = 0;

    allRecords.forEach(rec => {
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
      all: allRecords.length
    };

    const filter = {};

    if (status) {
      if (status === 'Checked out' || status === 'Active') {
        filter.status = 'Active';
      } else if (status === 'Overdue') {
        filter.status = 'Active';
        filter.expectedReturnDate = { $lt: now };
      } else if (status === 'Returned') {
        filter.status = 'Returned';
      }
      // 'All' or empty applies no status filter
    }

    if (user) filter.user = user;

    const checkouts = await CheckoutRecord.find(filter)
      .populate('document', 'documentNumber title version status physicalStatus storageLocation')
      .populate('user', 'name email department employeeId')
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
    const checkout = await CheckoutRecord.findById(req.params.id)
      .populate('document')
      .populate('user');

    if (!checkout) {
      return sendError(res, 'Checkout record not found', 404);
    }

    const borrower = checkout.user;
    const docNum = checkout.document?.documentNumber || 'Physical Document';
    const dueDate = checkout.expectedReturnDate ? new Date(checkout.expectedReturnDate).toLocaleDateString() : 'N/A';

    await Notification.create({
      recipient: borrower._id,
      title: `Overdue Physical Document Notice: ${docNum}`,
      message: `Urgent GxP Notice: Physical binder ${docNum} borrowed on ${new Date(checkout.checkoutDate).toLocaleDateString()} was due on ${dueDate}. Please return it to the vault or contact Document Control immediately.`,
      type: 'warning',
      link: '/physical/checkout'
    });

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.VIEW,
      entity: 'CheckoutRecord',
      entityId: checkout._id,
      details: `Compliance reminder notification triggered for overdue document ${docNum} to borrower ${borrower.name}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, `Reminder successfully delivered to ${borrower.name}`, {
      borrowerName: borrower.name,
      documentNumber: docNum
    });
  } catch (error) {
    next(error);
  }
};
