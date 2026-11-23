import express from 'express';
import Table from '../models/Table.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all tables (Public / readable by waiters, kitchen, admin)
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Insert new table - ADMIN ONLY
// Tables are configured exclusively by the restaurant administrator / manager
router.post('/', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Permission Denied: Only Restaurant Admins/Managers can insert new tables into the restaurant layout.',
    });
  }
  next();
}, async (req, res) => {
  try {
    const { number, seats, status } = req.body;

    if (!number || typeof number !== 'number' || number <= 0) {
      return res.status(400).json({ error: 'Valid positive table number is required.' });
    }

    const existing = await Table.findOne({ number });
    if (existing) {
      return res.status(400).json({ error: `Table #${number} already exists in the restaurant layout.` });
    }

    const table = new Table({
      number,
      seats: seats ? Number(seats) : 4,
      status: status || 'available',
    });

    await table.save();
    res.status(201).json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Update table seats or info - ADMIN ONLY
router.put('/:id', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Permission Denied: Only Restaurant Admins can update dining table configurations.',
    });
  }
  next();
}, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Update table status (e.g. occupied, available, reserved) - Waiters & Admin
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Delete a table - ADMIN ONLY
router.delete('/:id', protect, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Permission Denied: Only Restaurant Admins can remove dining tables.',
    });
  }
  next();
}, async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: `Table #${table.number} removed from restaurant layout.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
