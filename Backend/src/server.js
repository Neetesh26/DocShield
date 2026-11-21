import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[DocuShield Server] Listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[DocuShield API] Health check at http://localhost:${PORT}/api/health`);
  });
};

startServer();

