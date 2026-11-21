import express from 'express';
import { getReportsOverview, exportDocumentsCSV } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', getReportsOverview);
router.get('/export-csv', exportDocumentsCSV);

export default router;

