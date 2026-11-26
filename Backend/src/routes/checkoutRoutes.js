import express from 'express';
import { getCheckouts, createCheckout, returnCheckout, remindCheckout } from '../controllers/checkoutController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCheckouts);
router.post('/', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.QA_MANAGER, ROLES.DOCUMENT_CONTROLLER), createCheckout);
router.post('/:id/return', returnCheckout);
router.post('/:id/remind', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.QA_MANAGER, ROLES.DOCUMENT_CONTROLLER), remindCheckout);

export default router;
