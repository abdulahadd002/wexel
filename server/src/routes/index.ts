import { Router } from 'express';
import authRoutes from './authRoutes';
import billRoutes from './billRoutes';
import sheetRoutes from './sheetRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bills', billRoutes);
router.use('/sheets', sheetRoutes);

export default router;
