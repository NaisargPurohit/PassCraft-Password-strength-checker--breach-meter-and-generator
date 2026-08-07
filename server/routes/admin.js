import express from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * Fetch all team members and their roles.
 */
router.get('/users', checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    console.error('Error fetching team users:', err);
    return res.status(500).json({ error: 'Failed to fetch team users' });
  }
});

/**
 * Update user role (Admin only).
 */
router.put('/users/:id/role', checkRole(['Admin']), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['Admin', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin, Manager, or Employee' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    await AuditLog.create({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'SHARE',
      itemTitle: `Updated ${user.email} role to ${role}`,
    });

    return res.json({ message: 'User role updated successfully', user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error updating user role:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * Record an audit log entry.
 */
router.post('/audit-logs', async (req, res) => {
  try {
    const { action, vaultItemId, itemTitle } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    const log = new AuditLog({
      userId: req.user.userId,
      userEmail: req.user.email,
      action,
      vaultItemId,
      itemTitle: itemTitle || 'Vault Entry',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser',
    });

    await log.save();
    return res.status(201).json({ message: 'Audit log recorded', log });
  } catch (err) {
    console.error('Error recording audit log:', err);
    return res.status(500).json({ error: 'Failed to record audit log' });
  }
});

/**
 * Query and filter security audit logs.
 */
router.get('/audit-logs', checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { action, search } = req.query || {};
    const query = {};

    if (action && action !== 'ALL') {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { itemTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100);
    return res.json({ logs });
  } catch (err) {
    console.error('Error querying audit logs:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
