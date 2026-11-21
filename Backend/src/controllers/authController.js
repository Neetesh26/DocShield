import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/index.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password credentials', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is deactivated. Contact Document Control.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password credentials', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();

    // Log GxP Audit event
    await logAuditEvent({
      user,
      action: AUDIT_ACTIONS.LOGIN,
      entity: 'Authentication',
      entityId: user._id,
      details: `User ${user.name} (${user.email}) successfully logged in with role [${user.role}].`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        designation: user.designation
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  return sendSuccess(res, 'Current user profile retrieved', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      employeeId: req.user.employeeId,
      designation: req.user.designation
    }
  });
};

export const logout = async (req, res) => {
  if (req.user) {
    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: 'Authentication',
      entityId: req.user._id,
      details: `User ${req.user.name} logged out.`,
      ipAddress: req.ip || '127.0.0.1'
    });
  }
  return sendSuccess(res, 'Logged out successfully');
};

