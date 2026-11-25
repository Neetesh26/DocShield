import express from 'express';
import {
  getMasterDataOverview,
  createDepartment,
  createDocumentType,
  updateDocumentType,
  createStorageLocation
} from '../controllers/masterDataController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMasterDataOverview);
router.post('/departments', requireRole(ROLES.ADMIN, ROLES.QA), createDepartment);
router.post('/document-types', requireRole(ROLES.ADMIN, ROLES.QA), createDocumentType);
router.put('/document-types/:id', requireRole(ROLES.ADMIN, ROLES.QA), updateDocumentType);
router.post('/locations', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), createStorageLocation);

export default router;

