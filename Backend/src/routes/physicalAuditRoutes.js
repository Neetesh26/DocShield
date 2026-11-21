import express from 'express';
import {
  getAudits,
  getAuditById,
  createAudit,
  verifyAuditItem,
  completeAudit
} from '../controllers/physicalAuditController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAudits);
router.post('/', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), createAudit);
router.get('/:id', getAuditById);
router.put('/:id/verify-item', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), verifyAuditItem);
router.post('/:id/complete', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), completeAudit);

export default router;

