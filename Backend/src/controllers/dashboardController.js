import Document from '../models/Document.js';
import DocumentRequest from '../models/DocumentRequest.js';
import Approval from '../models/Approval.js';
import CheckoutRecord from '../models/CheckoutRecord.js';
import Handover from '../models/Handover.js';
import AuditLog from '../models/AuditLog.js';
import StorageLocation from '../models/StorageLocation.js';
import User from '../models/User.js';
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

    // 3. Document Upload Trends (Group by Month of past 12 months)
    const rawUploadTrends = await Document.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          documents: { $sum: 1 }
        }
      },
      { $project: { month: '$_id', documents: 1, _id: 0 } },
      { $sort: { month: 1 } }
    ]);

    // Build rolling 12 months sequence (e.g. Dec, Jan, Feb... Nov)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    rawUploadTrends.forEach(item => {
      trendMap[item.month] = item.documents;
    });

    const uploadTrends = [];
    const dateCursor = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(dateCursor.getFullYear(), dateCursor.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = monthNames[d.getMonth()];
      uploadTrends.push({
        month: label,
        yearMonth: key,
        documents: trendMap[key] || 0
      });
    }

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

    const userId = req.user?._id || req.user?.id;

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
        userId
          ? Handover.find({ newCustodian: userId, status: 'Pending Acceptance' })
              .populate('previousCustodian', 'name email')
              .limit(4)
          : Handover.find({ status: 'Pending Acceptance' })
              .populate('previousCustodian', 'name email')
              .limit(4),
        userId
          ? CheckoutRecord.find({ user: userId, status: 'Active' })
              .populate('document', 'documentNumber title')
              .limit(4)
          : CheckoutRecord.find({ status: 'Active' })
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

