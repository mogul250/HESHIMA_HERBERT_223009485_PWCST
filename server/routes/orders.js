import express from 'express';
import Order from '../models/Order.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Define allowed status transitions for orders
const VALID_TRANSITIONS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [], // terminal
  cancelled: [], // terminal
};

// Roles allowed to trigger specific transitions
const TRANSITION_ROLES = {
  preparing: ['kitchen', 'admin'],
  ready: ['kitchen', 'admin'],
  served: ['waiter', 'admin'],
  cancelled: ['waiter', 'admin'],
};

// 1. GET /api/orders - Get orders with pagination, filtering & search
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 9 } = req.query;
    const filter = {};

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.status = { $in: ['pending', 'preparing', 'ready'] };
      } else {
        filter.status = status;
      }
    }

    // Search filter (table number, waiter name, or order ID)
    if (search && search.trim()) {
      const searchNum = Number(search.trim());
      const searchConditions = [
        { waiterName: { $regex: search.trim(), $options: 'i' } },
        { 'items.name': { $regex: search.trim(), $options: 'i' } },
      ];
      if (!isNaN(searchNum)) {
        searchConditions.push({ tableNumber: searchNum });
      }
      filter.$or = searchConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 9);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.json({
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/orders/:id - Get single order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/orders - Create order (Waiter or Admin only) with input validation
router.post('/', protect, authorize('waiter', 'admin'), async (req, res) => {
  try {
    const { tableNumber, items, totalAmount, notes, waiterName } = req.body;

    // Bad Input Validation: Table is strictly mandatory
    if (!tableNumber || typeof tableNumber !== 'number' || tableNumber <= 0) {
      return res.status(400).json({
        error: 'Validation failed: Order must be connected and assigned to a valid dining table (table number must be > 0) before sending to the kitchen.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Validation failed: Order must contain at least one item.',
      });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.price || item.price < 0 || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          error: `Validation failed: Item #${i + 1} must have a valid name, price (>=0), and quantity (>=1).`,
        });
      }
    }

    const calculatedTotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    const order = new Order({
      tableNumber,
      items,
      totalAmount: totalAmount || calculatedTotal,
      notes: notes || '',
      waiterName: waiterName || req.user?.name || 'Staff',
      status: 'pending',
    });

    await order.save();
    const populated = await Order.findById(order._id).populate('items.menuItem');

    // Emit real-time events to both kitchen and waiters
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('new-order', populated);
      io.to('waiter').emit('new-order', populated);
      io.emit('order-updated', populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. PATCH /api/orders/:id/status - Update order status with state machine & role validation
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status: targetStatus } = req.body;
    const userRole = req.user?.role || 'waiter';

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = order.status;

    // Check if target status is a recognized value
    if (!['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(targetStatus)) {
      return res.status(400).json({
        error: `Invalid status '${targetStatus}'. Must be one of: pending, preparing, ready, served, cancelled.`,
      });
    }

    // Role check for transition
    const allowedRoles = TRANSITION_ROLES[targetStatus] || ['admin'];
    if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${userRole}' is not authorized to set order status to '${targetStatus}'. Allowed roles: ${allowedRoles.join(', ')}.`,
      });
    }

    // State Machine Validation (Prevents "kitchen marks served before cooking" / skipping steps)
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(targetStatus)) {
      // Clear human-readable error messages for specific business rule violations
      if (currentStatus === 'pending' && targetStatus === 'served') {
        return res.status(400).json({
          error: "Invalid status transition: Cannot mark order as 'served' before cooking! The kitchen must first prepare the order and mark it as 'ready'.",
          currentStatus,
          targetStatus,
        });
      }
      if (currentStatus === 'preparing' && targetStatus === 'served') {
        return res.status(400).json({
          error: "Invalid status transition: Order is currently being cooked ('preparing'). It must be marked as 'ready' before it can be served.",
          currentStatus,
          targetStatus,
        });
      }
      if (currentStatus === 'served' || currentStatus === 'cancelled') {
        return res.status(400).json({
          error: `Invalid status transition: Order is already '${currentStatus}' and cannot be modified further.`,
          currentStatus,
          targetStatus,
        });
      }

      return res.status(400).json({
        error: `Invalid status transition: Cannot change order from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${allowedNextStatuses.join(', ')}.`,
        currentStatus,
        targetStatus,
      });
    }

    // Apply valid update
    order.status = targetStatus;
    order.updatedAt = new Date();
    await order.save();

    const populated = await Order.findById(order._id).populate('items.menuItem');

    // Broadcast status change immediately to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('order-updated', populated);
      io.to('waiter').emit('order-updated', populated);
      io.emit('order-updated', populated);
    }

    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. DELETE /api/orders/:id - Cancel order (Waiter or Admin only)
router.delete('/:id', protect, authorize('waiter', 'admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'served') {
      return res.status(400).json({
        error: "Cannot cancel an order that has already been served to the customer.",
      });
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('order-updated', order);
      io.to('waiter').emit('order-updated', order);
      io.emit('order-updated', order);
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
