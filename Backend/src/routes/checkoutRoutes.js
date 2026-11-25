import express from 'express';
import { getCheckouts, createCheckout, returnCheckout, remindCheckout } from '../controllers/checkoutController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCheckouts);
router.post('/', createCheckout);
router.post('/:id/return', returnCheckout);
router.post('/:id/remind', remindCheckout);

export default router;
