import express from 'express';
import { askDocumentAssistant } from '../controllers/assistantController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.post('/chat', askDocumentAssistant);

export default router;

