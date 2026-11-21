import express from 'express';
import {
  getDashboardStats,
  getDashboardCharts,
  getDashboardWidgets
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/widgets', getDashboardWidgets);

export default router;

