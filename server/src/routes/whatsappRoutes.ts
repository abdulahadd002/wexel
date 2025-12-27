import { Router } from 'express';
import {
  verifyWebhook,
  handleWebhook,
  getContactPhotos,
  getAllPhotos,
} from '../controllers/whatsappController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

router.get('/photos', authenticate, getAllPhotos);
router.get('/photos/:contactId', authenticate, getContactPhotos);

export default router;
