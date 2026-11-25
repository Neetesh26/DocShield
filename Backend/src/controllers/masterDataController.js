import Department from '../models/Department.js';
import DocumentType from '../models/DocumentType.js';
import StorageLocation from '../models/StorageLocation.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/index.js';

export const getMasterDataOverview = async (req, res, next) => {
  try {
    const [departments, documentTypes, locations, users] = await Promise.all([
      Department.find().sort({ code: 1 }),
      DocumentType.find().sort({ code: 1 }),
      StorageLocation.find().sort({ building: 1, rack: 1, shelf: 1, bin: 1 }),
      User.find().select('name email role department employeeId designation isActive').sort({ name: 1 })
    ]);

    return sendSuccess(res, 'Master data retrieved', {
      departments,
      documentTypes,
      locations,
      users
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headName } = req.body;
    if (!name || !code) return sendError(res, 'Name and code are required', 400);

    const dept = new Department({ name, code: code.toUpperCase(), description, headName });
    await dept.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'Department',
      entityId: dept._id,
      details: `Added Master Department ${dept.code} - ${dept.name}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Department created', dept, 201);
  } catch (error) {
    next(error);
  }
};

export const createDocumentType = async (req, res, next) => {
  try {
    const { name, code, prefix, retentionYears = 5, reviewIntervalMonths = 12 } = req.body;
    if (!name || !code || !prefix) return sendError(res, 'Name, code, and prefix are required', 400);

    const docType = new DocumentType({
      name,
      code: code.toUpperCase(),
      prefix: prefix.toUpperCase(),
      retentionYears: Number(retentionYears),
      reviewIntervalMonths: Number(reviewIntervalMonths)
    });
    await docType.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'DocumentType',
      entityId: docType._id,
      details: `Created Document Type ${docType.code} (${docType.name})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Document Type created', docType, 201);
  } catch (error) {
    next(error);
  }
};

export const createStorageLocation = async (req, res, next) => {
  try {
    const { building, area, room, rack, shelf, bin, box = 'BX-01', capacity = 50, department = 'General', remarks = '' } = req.body;
    if (!building || !area || !room || !rack || !shelf || !bin) {
      return sendError(res, 'Building, area, room, rack, shelf, and bin are required', 400);
    }

    const code = `${building}/${area}/R${room}/RK${rack}/SH${shelf}/BIN${bin}`;
    const location = new StorageLocation({
      building,
      area,
      room,
      rack,
      shelf,
      bin,
      box,
      code,
      capacity: Number(capacity) || 50,
      department,
      remarks
    });

    await location.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'StorageLocation',
      entityId: location._id,
      details: `Registered storage location ${location.code} (Capacity: ${location.capacity})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Storage location created', location, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDocumentType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, prefix, retentionYears, reviewIntervalMonths, requiresPhysicalTracking } = req.body;
    const docType = await DocumentType.findById(id);
    if (!docType) return sendError(res, 'Document Type not found', 404);

    if (name) docType.name = name;
    if (code) docType.code = code.toUpperCase();
    if (prefix) docType.prefix = prefix.toUpperCase();
    if (retentionYears !== undefined) docType.retentionYears = Number(retentionYears);
    if (reviewIntervalMonths !== undefined) docType.reviewIntervalMonths = Number(reviewIntervalMonths);
    if (requiresPhysicalTracking !== undefined) docType.requiresPhysicalTracking = Boolean(requiresPhysicalTracking);

    await docType.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'DocumentType',
      entityId: docType._id,
      details: `Updated Retention & Review policy for Document Type ${docType.code}: Retention ${docType.retentionYears}y, Review ${docType.reviewIntervalMonths}m`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Document Type policy updated successfully', docType);
  } catch (error) {
    next(error);
  }
};

