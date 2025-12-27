import { Router } from 'express';
import authRoutes from './authRoutes';
import contactRoutes from './contactRoutes';
import billRoutes from './billRoutes';
import sheetRoutes from './sheetRoutes';
import whatsappRoutes from './whatsappRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/bills', billRoutes);
router.use('/sheets', sheetRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
