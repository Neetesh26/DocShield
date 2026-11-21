import express from 'express';
import {
  getHandovers,
  createHandover,
  acceptHandover,
  rejectHandover
} from '../controllers/handoverController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getHandovers);
router.post('/', createHandover);
router.post('/:id/accept', acceptHandover);
router.post('/:id/reject', rejectHandover);

export default router;

