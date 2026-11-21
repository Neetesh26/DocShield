import AuditLog from '../models/AuditLog.js';
import { sendSuccess } from '../utils/response.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, user, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (user) filter.userName = new RegExp(user, 'i');
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter)
    ]);

    return sendSuccess(res, 'Audit trail logs retrieved', logs, 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

