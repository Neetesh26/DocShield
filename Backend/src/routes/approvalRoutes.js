import express from 'express';
import { getApprovals, approveRequest, rejectRequest } from '../controllers/approvalController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getApprovals);
router.post('/:id/approve', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER, ROLES.DEPARTMENT_HEAD), approveRequest);
router.post('/:id/reject', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER, ROLES.DEPARTMENT_HEAD), rejectRequest);

export default router;

