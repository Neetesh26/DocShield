import express from 'express';
import { getTranslation, getBatchTranslations, getDictionary } from '../controllers/translateController.js';

const router = express.Router();

router.get('/', getTranslation);
router.post('/batch', getBatchTranslations);
router.get('/dictionary', getDictionary);

export default router;

