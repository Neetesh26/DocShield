import SystemSetting from '../models/SystemSetting.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/index.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'global_compliance' });
    if (!settings) {
      settings = await SystemSetting.create({
        key: 'global_compliance'
      });
    }
    return sendSuccess(res, 'Settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const {
      sessionTimeoutMin,
      maxPasswordAgeDays,
      electronicSignatureStatement,
      autoArchiveExpiredYears,
      requireDualSignOffForDestruction,
      enforceBarcodeScanOnReturn
    } = req.body;

    let settings = await SystemSetting.findOne({ key: 'global_compliance' });
    if (!settings) {
      settings = new SystemSetting({ key: 'global_compliance' });
    }

    if (sessionTimeoutMin !== undefined) settings.sessionTimeoutMin = String(sessionTimeoutMin);
    if (maxPasswordAgeDays !== undefined) settings.maxPasswordAgeDays = String(maxPasswordAgeDays);
    if (electronicSignatureStatement !== undefined) settings.electronicSignatureStatement = electronicSignatureStatement;
    if (autoArchiveExpiredYears !== undefined) settings.autoArchiveExpiredYears = String(autoArchiveExpiredYears);
    if (requireDualSignOffForDestruction !== undefined) settings.requireDualSignOffForDestruction = Boolean(requireDualSignOffForDestruction);
    if (enforceBarcodeScanOnReturn !== undefined) settings.enforceBarcodeScanOnReturn = Boolean(enforceBarcodeScanOnReturn);
    if (req.user) settings.updatedBy = req.user._id;

    await settings.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.SECURITY_CHANGE || 'SECURITY_CHANGE',
      entity: 'SystemSetting',
      entityId: settings._id,
      details: 'Updated global 21 CFR Part 11 compliance and retention parameters',
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

