import express from 'express';
import Table from '../models/Table.js';

const router = express.Router();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update table status
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

export default router;

