import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'docushield_super_secure_jwt_secret_key_gxp_2026'
    );

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 'User account not found or deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session token expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized. Please authenticate.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized for this action.`,
        403
      );
    }
    next();
  };
};

