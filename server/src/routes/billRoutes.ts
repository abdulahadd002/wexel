import { Router } from 'express';
import {
  getBills,
  getBill,
  processBill,
  updateBill,
  deleteBill,
} from '../controllers/billController';
import { authenticate } from '../middleware/auth';
import { billValidation } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', getBills);
router.get('/:id', getBill);
router.post('/process', billValidation.process, processBill);
router.put('/:id', billValidation.update, updateBill);
router.delete('/:id', deleteBill);

export default router;
