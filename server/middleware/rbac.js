import mongoose from 'mongoose';
import User from '../models/User.js';
import { inMemoryUsers } from '../routes/auth.js';

/**
 * Express Role-Based Access Control (RBAC) Middleware
 * Enforces role permissions ('Admin', 'Manager', 'Employee') on protected routes.
 * @param {Array<string>} allowedRoles - List of allowed roles e.g. ['Admin', 'Manager']
 */
export const checkRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
      }

      let userRole = 'Admin'; // Default fallback role

      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(req.user.userId).select('role email organizationId');
        if (user && user.role) {
          userRole = user.role;
        }
      } else {
        const memUser = inMemoryUsers.find(u => u._id === req.user.userId);
        if (memUser && memUser.role) {
          userRole = memUser.role;
        }
      }

      req.user.role = userRole;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Forbidden. Your role (${userRole}) does not have permission to access this resource. Allowed roles: ${allowedRoles.join(', ')}`,
        });
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.status(500).json({ error: 'Internal RBAC authorization error' });
    }
  };
};
