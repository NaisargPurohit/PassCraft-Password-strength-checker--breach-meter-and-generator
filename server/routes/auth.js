import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'passcraft-super-secret-jwt-key-2026';

router.post('/register', async (req, res) => {
  try {
    const { email, password, salt } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and master password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: cleanEmail,
      passwordHash: hash,
      salt: userSalt,
      role: 'Admin',
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // console.log("user registered ok:", newUser.email);

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
  } catch (err) {
    // console.error("reg error:", err);
    return res.status(500).json({ error: 'Failed to create user account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
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
  } catch (err) {
    // console.error("login err:", err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching user profile' });
  }
});

router.get('/threat-intel', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('isBreached breaches lastThreatCheck');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      isBreached: user.isBreached,
      breaches: user.breaches,
      lastCheck: user.lastThreatCheck,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching threat intelligence' });
  }
});

export default router;
