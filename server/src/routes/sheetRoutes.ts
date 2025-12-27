import { Router } from 'express';
import {
  getSheets,
  getSheetByDate,
  exportSheet,
  getGrossSales,
} from '../controllers/sheetController';
import { authenticate } from '../middleware/auth';
import { sheetValidation } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', getSheets);
router.get('/gross-sales', getGrossSales);
router.get('/:date', sheetValidation.getByDate, getSheetByDate);
router.get('/:date/export', sheetValidation.getByDate, exportSheet);

export default router;
