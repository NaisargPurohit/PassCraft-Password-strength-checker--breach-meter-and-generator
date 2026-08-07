import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { inMemoryUsers } from './auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);

const inMemoryAuditLogs = [];
const isMongoConnected = () => mongoose.connection.readyState === 1;

// ==========================================
// 1. GET ALL TEAM USERS & ROLES
// ==========================================
router.get('/users', checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    if (isMongoConnected()) {
      const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
      return res.json({ users });
    } else {
      const users = inMemoryUsers.map(({ passwordHash, ...rest }) => rest);
      return res.json({ users });
    }
  } catch (err) {
    console.error('Error fetching team users:', err);
    return res.status(500).json({ error: 'Failed to fetch team users' });
  }
});

// ==========================================
// 2. UPDATE USER ROLE (ADMIN ONLY)
// ==========================================
router.put('/users/:id/role', checkRole(['Admin']), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['Admin', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin, Manager, or Employee' });
    }

    if (isMongoConnected()) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.role = role;
      await user.save();
      return res.json({ message: 'User role updated successfully', user: { id: user._id, email: user.email, role: user.role } });
    } else {
      const user = inMemoryUsers.find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.role = role;
      return res.json({ message: 'User role updated successfully (In-Memory)', user: { id: user._id, email: user.email, role: user.role } });
    }
  } catch (err) {
    console.error('Error updating user role:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ==========================================
// 3. RECORD AN AUDIT LOG ENTRY
// ==========================================
router.post('/audit-logs', async (req, res) => {
  try {
    const { action, vaultItemId, itemTitle } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    const logEntry = {
      userId: req.user.userId,
      userEmail: req.user.email,
      action,
      vaultItemId,
      itemTitle: itemTitle || 'Vault Entry',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser',
      createdAt: new Date(),
    };

    if (isMongoConnected()) {
      const log = new AuditLog(logEntry);
      await log.save();
      return res.status(201).json({ message: 'Audit log recorded', log });
    } else {
      const log = { _id: 'mem_log_' + Date.now(), ...logEntry };
      inMemoryAuditLogs.unshift(log);
      return res.status(201).json({ message: 'Audit log recorded (In-Memory)', log });
    }
  } catch (err) {
    console.error('Error recording audit log:', err);
    return res.status(500).json({ error: 'Failed to record audit log' });
  }
});

// ==========================================
// 4. QUERY & FILTER AUDIT LOGS (ADMIN / MANAGER)
// ==========================================
router.get('/audit-logs', checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { action, search } = req.query || {};

    if (isMongoConnected()) {
      const query = {};
      if (action && action !== 'ALL') query.action = action;
      if (search) {
        query.$or = [
          { userEmail: { $regex: search, $options: 'i' } },
          { itemTitle: { $regex: search, $options: 'i' } },
        ];
      }
      const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100);
      return res.json({ logs });
    } else {
      let filtered = [...inMemoryAuditLogs];
      if (action && action !== 'ALL') {
        filtered = filtered.filter(l => l.action === action);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(l => (l.userEmail || '').toLowerCase().includes(q) || (l.itemTitle || '').toLowerCase().includes(q));
      }
      return res.json({ logs: filtered.slice(0, 100) });
    }
  } catch (err) {
    console.error('Error querying audit logs:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
