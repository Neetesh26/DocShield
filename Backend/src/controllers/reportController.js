import Document from '../models/Document.js';
import CheckoutRecord from '../models/CheckoutRecord.js';
import PhysicalAudit from '../models/PhysicalAudit.js';
import DocumentRequest from '../models/DocumentRequest.js';
import StorageLocation from '../models/StorageLocation.js';
import { sendSuccess } from '../utils/response.js';

export const getReportsOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    if (department) dateFilter.department = department;

    const [
      docsByDept,
      docsByType,
      docsByStatus,
      checkoutsByStatus,
      requestsByType,
      auditsSummary
    ] = await Promise.all([
      Document.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $project: { department: '$_id', count: 1, _id: 0 } }
      ]),
      Document.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } }
      ]),
      Document.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      CheckoutRecord.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      DocumentRequest.aggregate([
        { $group: { _id: '$requestType', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } }
      ]),
      PhysicalAudit.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalFound: { $sum: '$summary.foundCount' },
            totalMissing: { $sum: '$summary.missingCount' }
          }
        }
      ])
    ]);

    return sendSuccess(res, 'Report overview generated', {
      docsByDept,
      docsByType,
      docsByStatus,
      checkoutsByStatus,
      requestsByType,
      auditsSummary
    });
  } catch (error) {
    next(error);
  }
};

export const exportDocumentsCSV = async (req, res, next) => {
  try {
    const docs = await Document.find()
      .populate('currentCustodian', 'name email employeeId')
      .populate('storageLocation');

    // Generate CSV Header
    const headers = [
      'Document Number',
      'Title',
      'Version',
      'Type',
      'Department',
      'Status',
      'Physical Status',
      'Custodian',
      'Location Code',
      'Effective Date',
      'Review Date'
    ];

    const rows = docs.map(d => [
      `"${d.documentNumber}"`,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${d.version}"`,
      `"${d.documentType}"`,
      `"${d.department}"`,
      `"${d.status}"`,
      `"${d.physicalStatus}"`,
      `"${d.currentCustodian?.name || ''}"`,
      `"${d.storageLocation?.code || ''}"`,
      `"${d.effectiveDate ? new Date(d.effectiveDate).toISOString().split('T')[0] : ''}"`,
      `"${d.reviewDate ? new Date(d.reviewDate).toISOString().split('T')[0] : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="docushield_repository_export.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

