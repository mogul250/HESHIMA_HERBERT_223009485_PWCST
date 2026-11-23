import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import tableRoutes from './routes/tables.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    socket.join(room);
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-order-system';

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      const PORT = process.env.PORT || 5000;
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

export { app, httpServer, io };
export default app;
