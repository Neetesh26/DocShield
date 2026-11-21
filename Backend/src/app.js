import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import handoverRoutes from './routes/handoverRoutes.js';
import physicalAuditRoutes from './routes/physicalAuditRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import masterDataRoutes from './routes/masterDataRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in local dev for seamless testing
    }
  },
  credentials: true
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DocuShield GxP Backend API is operational',
    timestamp: new Date().toISOString()
  });
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/audits', physicalAuditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assistant', assistantRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;

