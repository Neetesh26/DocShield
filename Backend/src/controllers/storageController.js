import StorageLocation from '../models/StorageLocation.js';
import Document from '../models/Document.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/index.js';

export const getStorageLocations = async (req, res, next) => {
  try {
    const { building, area, department, status, search } = req.query;
    const filter = {};
    if (building) filter.building = building;
    if (area) filter.area = area;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { code: new RegExp(search, 'i') },
        { building: new RegExp(search, 'i') },
        { area: new RegExp(search, 'i') },
        { room: new RegExp(search, 'i') },
        { rack: new RegExp(search, 'i') },
        { bin: new RegExp(search, 'i') }
      ];
    }

    const locations = await StorageLocation.find(filter)
      .sort({ building: 1, area: 1, rack: 1, shelf: 1, bin: 1 })
      .lean();

    // Dynamically calculate actual real-time document occupancy from the documents collection
    const counts = await Document.aggregate([
      { $group: { _id: '$storageLocation', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[String(c._id)] = c.count;
    });

    const synchronizedLocations = locations.map(loc => {
      const realOccupancy = countMap[String(loc._id)] || 0;
      return {
        ...loc,
        currentOccupancy: realOccupancy
      };
    });

    return sendSuccess(res, 'Storage locations retrieved', synchronizedLocations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Storage Hierarchy tree for visual Storage Map navigation
 */
export const getStorageHierarchy = async (req, res, next) => {
  try {
    const locations = await StorageLocation.find().sort({ building: 1, area: 1, rack: 1 }).lean();

    const counts = await Document.aggregate([
      { $group: { _id: '$storageLocation', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[String(c._id)] = c.count;
    });

    // Build hierarchical tree: Building -> Area -> Room -> Rack -> Shelf -> Bin
    const tree = {};

    locations.forEach(loc => {
      if (!tree[loc.building]) tree[loc.building] = {};
      if (!tree[loc.building][loc.area]) tree[loc.building][loc.area] = {};
      if (!tree[loc.building][loc.area][loc.rack]) tree[loc.building][loc.area][loc.rack] = [];

      const realOccupancy = countMap[String(loc._id)] || 0;

      tree[loc.building][loc.area][loc.rack].push({
        id: loc._id,
        code: loc.code,
        room: loc.room,
        shelf: loc.shelf,
        bin: loc.bin,
        box: loc.box,
        capacity: loc.capacity,
        currentOccupancy: realOccupancy,
        status: loc.status,
        department: loc.department
      });
    });

    return sendSuccess(res, 'Storage hierarchy retrieved', tree);
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req, res, next) => {
  try {
    const location = await StorageLocation.findById(req.params.id).lean();
    if (!location) {
      return sendError(res, 'Storage location not found', 404);
    }

    // Get documents currently stored in this location
    const storedDocuments = await Document.find({ storageLocation: location._id })
      .populate('currentCustodian', 'name email department')
      .select('documentNumber title version status physicalStatus currentCustodian boxNumber fileNumber effectiveDate');

    location.currentOccupancy = storedDocuments.length;

    return sendSuccess(res, 'Location details retrieved', {
      location,
      storedDocuments,
      occupancyCount: storedDocuments.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move document to another physical storage location
 */
export const moveDocument = async (req, res, next) => {
  try {
    const { documentId, newLocationId, remarks = '' } = req.body;

    if (!documentId || !newLocationId) {
      return sendError(res, 'Document ID and New Location ID are required', 400);
    }

    const [doc, newLoc] = await Promise.all([
      Document.findById(documentId).populate('storageLocation'),
      StorageLocation.findById(newLocationId)
    ]);

    if (!doc) return sendError(res, 'Document not found', 404);
    if (!newLoc) return sendError(res, 'Target storage location not found', 404);

    if (newLoc.currentOccupancy >= newLoc.capacity) {
      return sendError(res, `Target location ${newLoc.code} is at full capacity`, 400);
    }

    const previousLocationCode = doc.storageLocation?.code || 'Unknown';
    const oldLocId = doc.storageLocation?._id;

    // Decrement previous location occupancy
    if (oldLocId) {
      await StorageLocation.findByIdAndUpdate(oldLocId, { $inc: { currentOccupancy: -1 } });
    }

    // Increment new location occupancy
    newLoc.currentOccupancy += 1;
    await newLoc.save();

    // Update document storage location
    doc.storageLocation = newLoc._id;
    await doc.save();

    // Immutable GxP Audit Log
    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'PhysicalStorage',
      entityId: doc._id,
      details: `Moved Document ${doc.documentNumber} from ${previousLocationCode} to ${newLoc.code}. Remarks: ${remarks}`,
      metadata: { previousLocation: previousLocationCode, newLocation: newLoc.code, remarks },
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, `Document successfully relocated to ${newLoc.code}`, {
      document: doc,
      newLocation: newLoc
    });
  } catch (error) {
    next(error);
  }
};

