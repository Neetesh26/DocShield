import User from '../models/User.js';
import { sendSuccess } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const { department, role } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('name email role department employeeId designation')
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
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return sendSuccess(res, 'User retrieved', user);
  } catch (error) {
    next(error);
  }
};

