import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({
  user = null,
  userName = 'System',
  userRole = 'System',
  action,
  entity,
  entityId = '',
  details,
  previousValue = null,
  newValue = null,
  reason = '',
  signature = null,
  metadata = {},
  ipAddress = '127.0.0.1'
}) => {
  try {
    const entry = new AuditLog({
      user: user?._id || user || null,
      userName: user?.name || userName,
      userRole: user?.role || userRole,
      action,
      entity,
      entityId: String(entityId),
      details,
      previousValue,
      newValue,
      reason,
      signature: signature || {
        signerName: user?.name || userName,
        signerRole: user?.role || userRole,
        meaning: action,
        signedAt: new Date()
      },
      metadata,
      ipAddress
    });
    await entry.save();
    return entry;
  } catch (error) {
    console.error('[Audit Log Error] Failed to write audit trail:', error.message);
    // Never crash the primary workflow on audit log failure, but log severely
    return null;
  }
};

