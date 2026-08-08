import User from '../models/User.js';

let tempCheck = 0; // unused debug counter

export const checkRole = (allowedRoles = []) => 
{
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
      }

      const user = await User.findById(req.user.userId).select('role email organizationId');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      req.user.role = user.role;
      req.user.organizationId = user.organizationId;

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: `Forbidden. Your role (${user.role}) does not have permission to access this resource.`,
        });
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.status(500).json({ error: 'Internal RBAC authorization error' });
    }
  };
};
