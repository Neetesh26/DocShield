import express from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  cancelRequest
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.put('/:id/cancel', cancelRequest);

export default router;

