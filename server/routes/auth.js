import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'passcraft-super-secret-jwt-key-2026';

// In-Memory Fallback Storage (Used when MongoDB is offline)
export const inMemoryUsers = [];

// Helper to check if MongoDB is active
const isMongoConnected = () => mongoose.connection.readyState === 1;

// ==========================================
// 1. USER REGISTRATION
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, salt } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and master password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userSalt = salt || crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    if (isMongoConnected()) {
      // --- MongoDB Mode ---
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const newUser = new User({
        email: cleanEmail,
        passwordHash,
        salt: userSalt,
        role: 'Admin',
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id.toString(), email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account created successfully',
        token,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          salt: newUser.salt,
          role: newUser.role,
          isBreached: newUser.isBreached,
          breaches: newUser.breaches,
        },
      });
    } else {
      // --- In-Memory Fallback Mode ---
      console.log('[Auth API] MongoDB offline. Using In-Memory fallback store.');
      const existing = inMemoryUsers.find(u => u.email === cleanEmail);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const userId = 'mem_u_' + Date.now();
      const newUser = {
        _id: userId,
        email: cleanEmail,
        passwordHash,
        salt: userSalt,
        role: 'Admin',
        isBreached: false,
        breaches: [],
        createdAt: new Date(),
      };

      inMemoryUsers.push(newUser);

      const token = jwt.sign(
        { userId: userId, email: cleanEmail },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account created successfully (In-Memory)',
        token,
        user: {
          id: userId,
          email: cleanEmail,
          salt: userSalt,
          role: newUser.role,
          isBreached: false,
          breaches: [],
        },
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: `Registration error: ${err.message}` });
  }
});

// ==========================================
// 2. USER LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      // --- MongoDB Mode ---
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          salt: user.salt,
          role: user.role,
          isBreached: user.isBreached,
          breaches: user.breaches,
        },
      });
    } else {
      // --- In-Memory Fallback Mode ---
      const user = inMemoryUsers.find(u => u.email === cleanEmail);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful (In-Memory)',
        token,
        user: {
          id: user._id,
          email: user.email,
          salt: user.salt,
          role: user.role,
          isBreached: user.isBreached,
          breaches: user.breaches,
        },
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: `Login error: ${err.message}` });
  }
});

// ==========================================
// 3. GET CURRENT LOGGED-IN USER & THREAT INTEL
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { passwordHash, ...userClean } = user;
      return res.json({ user: userClean });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching user profile' });
  }
});

router.get('/threat-intel', authMiddleware, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findById(req.user.userId).select('isBreached breaches lastThreatCheck');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({
        isBreached: user.isBreached,
        breaches: user.breaches,
        lastCheck: user.lastThreatCheck,
      });
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user.userId);
      return res.json({
        isBreached: user?.isBreached || false,
        breaches: user?.breaches || [],
        lastCheck: new Date(),
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching threat intelligence' });
  }
});

export default router;
