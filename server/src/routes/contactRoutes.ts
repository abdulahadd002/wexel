import { Router } from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contactController';
import { authenticate } from '../middleware/auth';
import { contactValidation } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', contactValidation.create, createContact);
router.put('/:id', contactValidation.update, updateContact);
router.delete('/:id', contactValidation.delete, deleteContact);

export default router;
