import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, ROLES } from '../constants/index.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, employeeId, designation, phone } = req.body;

    if (!name || !email || !password || !department || !employeeId) {
      return sendError(res, 'Name, email, password, department, and employee ID are required', 400);
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return sendError(res, `User with email '${email}' already exists`, 409);
    }

    const existingEmpId = await User.findOne({ employeeId });
    if (existingEmpId) {
      return sendError(res, `User with employee ID '${employeeId}' already exists`, 409);
    }

    const validRoles = Object.values(ROLES);
    const assignedRole = role && validRoles.includes(role) ? role : ROLES.EMPLOYEE;

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      department: department.trim(),
      employeeId: employeeId.trim(),
      designation: designation?.trim() || 'Staff',
      phone: phone?.trim() || '',
      isActive: true
    });

    await user.save();

    await logAuditEvent({
      user,
      action: AUDIT_ACTIONS.LOGIN,
      entity: 'Authentication',
      entityId: user._id,
      details: `User registered: ${user.name} (${user.email}) with role [${user.role}].`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const token = user.generateAuthToken();

    return sendSuccess(res, 'User registered successfully', {
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        designation: user.designation
      }
    }, 201);
  } catch (error) {
    next(error);
  }
};

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
        _id: user._id,
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
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      employeeId: req.user.employeeId,
      designation: req.user.designation,
      avatar: req.user.avatar || null
    }
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    await logAuditEvent({
      user,
      action: AUDIT_ACTIONS.PROFILE_UPDATE || 'PROFILE_UPDATE',
      entity: 'User',
      entityId: user._id,
      details: `User ${user.email} updated profile settings and avatar`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return sendSuccess(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        designation: user.designation,
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    next(error);
  }
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
