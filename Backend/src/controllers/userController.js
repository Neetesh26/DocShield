import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, ROLES } from '../constants/index.js';

export const getUsers = async (req, res, next) => {
  try {
    const { department, role } = req.query;
    const filter = {};
    if (req.query.activeOnly !== 'false') {
      filter.isActive = true;
    }
    if (department) filter.department = department;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('name email role department employeeId designation phone isActive createdAt')
      .sort({ name: 1 });

    return sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, 'User retrieved', user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, employeeId, designation, phone } = req.body;

    if (!name || !email || !password || !department || !employeeId) {
      return sendError(res, 'Name, email, password, department, and employee ID are required', 400);
    }

    // Check for existing user by email or employeeId
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return sendError(res, `User with email '${email}' already exists`, 409);
    }

    const existingEmpId = await User.findOne({ employeeId });
    if (existingEmpId) {
      return sendError(res, `User with employee ID '${employeeId}' already exists`, 409);
    }

    // Validate role
    const validRoles = Object.values(ROLES);
    const assignedRole = role && validRoles.includes(role) ? role : ROLES.USER;

    const newUser = new User({
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

    await newUser.save();

    // Log GxP Audit event
    await logAuditEvent({
      user: req.user || newUser,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'User',
      entityId: newUser._id,
      details: `Created new user ${newUser.name} (${newUser.email}) with role [${newUser.role}] in department [${newUser.department}].`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return sendSuccess(res, 'User created and stored in database successfully', userObj, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, department, designation, phone, isActive, password } = req.body;

    const user = await User.findById(id).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const changes = [];
    if (name && name !== user.name) {
      changes.push(`name: '${user.name}' -> '${name}'`);
      user.name = name;
    }
    if (role && role !== user.role) {
      changes.push(`role: '${user.role}' -> '${role}'`);
      user.role = role;
    }
    if (department && department !== user.department) {
      changes.push(`department: '${user.department}' -> '${department}'`);
      user.department = department;
    }
    if (designation !== undefined && designation !== user.designation) {
      user.designation = designation;
    }
    if (phone !== undefined && phone !== user.phone) {
      user.phone = phone;
    }
    if (isActive !== undefined && isActive !== user.isActive) {
      changes.push(`status: ${user.isActive ? 'Active' : 'Inactive'} -> ${isActive ? 'Active' : 'Inactive'}`);
      user.isActive = isActive;
    }
    if (password) {
      user.password = password;
      changes.push('password updated');
    }

    await user.save();

    await logAuditEvent({
      user: req.user,
      action: AUDIT_ACTIONS.MASTER_DATA_CHANGE,
      entity: 'User',
      entityId: user._id,
      details: `Updated user profile for ${user.name} (${user.email}). Changes: ${changes.join(', ') || 'minor profile update'}.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, 'User updated successfully', userObj);
  } catch (error) {
    next(error);
  }
};
