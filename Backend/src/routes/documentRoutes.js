import express from 'express';
import {
  extractDocumentMetadata,
  checkDuplicate,
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocumentMetadata,
  getDocumentQR,
  aiSearchDocuments,
  recordPeriodicReview,
  authorizeDestruction,
  getDestructionLogs
} from '../controllers/documentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

// Document upload & extraction pipeline (Step 1 -> Step 2)
router.post('/extract', upload.single('file'), extractDocumentMetadata);
router.post('/check-duplicate', checkDuplicate);

// Document CRUD & Listing
router.post('/ai-search', aiSearchDocuments);
router.get('/ai-search', aiSearchDocuments);
router.get('/destruction-logs', getDestructionLogs);
router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.put('/:id/metadata', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), updateDocumentMetadata);
router.post('/:id/periodic-review', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER, ROLES.CUSTODIAN), recordPeriodicReview);
router.post('/:id/destruction', requireRole(ROLES.ADMIN, ROLES.QA, ROLES.DOCUMENT_CONTROLLER), authorizeDestruction);
router.get('/:id/qr', getDocumentQR);

export default router;

