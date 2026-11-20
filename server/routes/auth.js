import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'waiter',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Current User Profile
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper route to seed demo accounts if not already present
router.post('/seed-demo', async (req, res) => {
  try {
    const demoAccounts = [
      { name: 'Sarah (Waiter)', email: 'waiter@restaurant.com', password: 'password123', role: 'waiter' },
      { name: 'Chef Marco', email: 'kitchen@restaurant.com', password: 'password123', role: 'kitchen' },
      { name: 'Alex Manager', email: 'admin@restaurant.com', password: 'password123', role: 'admin' },
    ];

    for (const acc of demoAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
      }
    }

    res.json({ message: 'Demo accounts verified/created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

