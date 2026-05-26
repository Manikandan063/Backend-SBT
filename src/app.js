console.log('--- APP.JS LOADING ---');
import('fs').then(fs => {
  fs.appendFileSync('startup.log', `[${new Date().toISOString()}] --- APP.JS LOADING ---\n`);
});
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorMiddleware } from './shared/middleware/errorMiddleware.js';

// Import Routes
import parentRoutes from './modules/parent/parent.routes.js';
import studentRoutes from './modules/student/student.routes.js';
import trackingRoutes from './modules/tracking/tracking.routes.js';
import transferRoutes from './modules/transfer/transfer.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import schoolRoutes from './modules/school/school.routes.js';
import busRoutes from './modules/bus/bus.routes.js';
import busStatusRoutes from './modules/busStatus/busStatus.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Request Logger for Debugging
app.use((req, res, next) => {
  const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  console.log(logEntry);
  import('fs').then(fs => {
    fs.appendFileSync('all_requests.log', logEntry);
  });
  next();
});

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to School Bus Tracking System API',
    version: '1.0.0'
  });
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/parent', parentRoutes); // Alias for singular parent endpoint compatibility
app.use('/api/students', studentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/bus-status', busStatusRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((req, res, next) => {
  console.log(`[404] Not Found: ${req.method} ${req.url}`);
  // Log to file
  import('fs').then(fs => {
    fs.appendFileSync('debug_404.log', `[${new Date().toISOString()}] 404: ${req.method} ${req.url}\n`);
  });
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
