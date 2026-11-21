import express from 'express';
import {
  getStorageLocations,
  getStorageHierarchy,
  getLocationById,
  moveDocument
} from '../controllers/storageController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/locations', getStorageLocations);
router.get('/hierarchy', getStorageHierarchy);
router.get('/locations/:id', getLocationById);
router.post('/move-document', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), moveDocument);

export default router;

