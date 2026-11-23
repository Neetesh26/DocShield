import express from 'express';
import { getUsers, getUserById, createUser, updateUser } from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', requireRole(ROLES.ADMIN, ROLES.QA), createUser);
router.put('/:id', requireRole(ROLES.ADMIN, ROLES.QA), updateUser);

export default router;
