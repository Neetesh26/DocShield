import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', requireRole(ROLES.ADMIN, ROLES.QA), updateSettings);

export default router;

