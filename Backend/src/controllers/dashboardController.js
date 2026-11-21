import Document from '../models/Document.js';
import DocumentRequest from '../models/DocumentRequest.js';
import Approval from '../models/Approval.js';
import CheckoutRecord from '../models/CheckoutRecord.js';
import Handover from '../models/Handover.js';
import AuditLog from '../models/AuditLog.js';
import StorageLocation from '../models/StorageLocation.js';
import { sendSuccess } from '../utils/response.js';
import { DOCUMENT_STATUSES } from '../constants/index.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalDocuments,
      effectiveDocuments,
      pendingApprovals,
      pendingRequests,
      dueForReview,
      overdueCheckouts,
      pendingHandovers,
      uploadedRecently
    ] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ status: DOCUMENT_STATUSES.EFFECTIVE }),
      Approval.countDocuments({ status: 'Pending' }),
      DocumentRequest.countDocuments({ status: 'Pending' }),
      Document.countDocuments({
        reviewDate: { $gte: now, $lte: in60Days }
      }),
      CheckoutRecord.countDocuments({
        status: 'Active',
        expectedReturnDate: { $lt: now }
      }),
      Handover.countDocuments({ status: 'Pending Acceptance' }),
      Document.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    return sendSuccess(res, 'Dashboard statistics retrieved', {
      totalDocuments,
      effectiveDocuments,
      pendingApprovals,
      pendingRequests,
      dueForReview,
      overdueCheckouts,
      pendingHandovers,
      uploadedRecently
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req, res, next) => {
  try {
    // 1. Documents by Type
    const byType = await Document.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // 2. Document Status Distribution
    const byStatus = await Document.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // 3. Document Upload Trends (Group by Month of current year)
    const uploadTrends = await Document.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          documents: { $sum: 1 }
        }
      },
      { $project: { month: '$_id', documents: 1, _id: 0 } },
      { $sort: { month: 1 } }
    ]);

    // 4. Storage Utilization
    const storageStats = await StorageLocation.aggregate([
      {
        $group: {
          _id: '$building',
          totalCapacity: { $sum: '$capacity' },
          totalOccupancy: { $sum: '$currentOccupancy' }
        }
      },
      {
        $project: {
          building: '$_id',
          capacity: '$totalCapacity',
          occupancy: '$totalOccupancy',
          utilization: {
            $round: [{ $multiply: [{ $divide: ['$totalOccupancy', { $cond: [{ $eq: ['$totalCapacity', 0] }, 1, '$totalCapacity'] }] }, 100] }, 1]
          },
          _id: 0
        }
      }
    ]);

    // 5. Request Status Distribution
    const byRequestStatus = await DocumentRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    return sendSuccess(res, 'Dashboard chart data retrieved', {
      byType,
      byStatus,
      uploadTrends,
      storageStats,
      byRequestStatus
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardWidgets = async (req, res, next) => {
  try {
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [recentDocuments, recentActivities, pendingTasks, upcomingReviews] = await Promise.all([
      Document.find()
        .populate('currentCustodian', 'name email')
        .populate('storageLocation')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('documentNumber title version status physicalStatus currentCustodian storageLocation createdAt'),

      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(8)
        .select('userName userRole action entity details timestamp'),

      // My pending tasks: approvals, handovers, checkouts
      Promise.all([
        Approval.find({ status: 'Pending' })
          .populate('document', 'documentNumber title version')
          .limit(4),
        Handover.find({ newCustodian: req.user._id, status: 'Pending Acceptance' })
          .populate('previousCustodian', 'name email')
          .limit(4),
        CheckoutRecord.find({ user: req.user._id, status: 'Active' })
          .populate('document', 'documentNumber title')
          .limit(4)
      ]).then(([approvals, handovers, myCheckouts]) => ({
        approvals,
        handovers,
        myCheckouts
      })),

      Document.find({
        reviewDate: { $gte: now, $lte: in90Days }
      })
        .populate('currentCustodian', 'name email')
        .sort({ reviewDate: 1 })
        .limit(5)
        .select('documentNumber title version reviewDate department currentCustodian')
    ]);

    return sendSuccess(res, 'Dashboard widgets data retrieved', {
      recentDocuments,
      recentActivities,
      pendingTasks,
      upcomingReviews
    });
  } catch (error) {
    next(error);
  }
};

