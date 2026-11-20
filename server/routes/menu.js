import express from 'express';
import MenuItem from '../models/MenuItem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all menu items (Public / readable by waiters & kitchen)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create menu item - ADMIN ONLY (Waiters cannot set or modify the menu)
router.post('/', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Waiters and staff cannot set the menu. Only Restaurant Admins can add or configure menu items.',
    });
  }
  next();
}, async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update menu item - ADMIN ONLY
router.put('/:id', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Waiters and staff cannot modify the menu. Only Restaurant Admins can update dishes.',
    });
  }
  next();
}, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle availability - ADMIN ONLY
router.patch('/:id/toggle', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Waiters cannot alter menu availability. Only Restaurant Admins can set dishes in or out of stock.',
    });
  }
  next();
}, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    item.available = !item.available;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete menu item - ADMIN ONLY
router.delete('/:id', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Waiters cannot delete items from the menu. Only Restaurant Admins can remove dishes.',
    });
  }
  next();
}, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
