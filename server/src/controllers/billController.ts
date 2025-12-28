import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { extractBillData } from '../services/openaiService';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const getBills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, startDate, endDate } = req.query;

  const where: any = { userId: req.userId };

  if (date) {
    where.billDate = new Date(date as string);
  } else if (startDate && endDate) {
    where.billDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const bills = await prisma.bill.findMany({
    where,
    orderBy: { billDate: 'desc' },
  });

  res.json({
    success: true,
    data: { bills },
  });
});

export const getBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const bill = await prisma.bill.findFirst({
    where: { id, userId: req.userId },
  });

  if (!bill) {
    throw createError('Bill not found', 404);
  }

  res.json({
    success: true,
    data: { bill },
  });
});

export const uploadAndProcessBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw createError('No image file provided', 400);
  }

  const { billDate } = req.body;
  const imagePath = `/uploads/${req.file.filename}`;

  // Convert image to base64 for OpenAI
  const imageBuffer = fs.readFileSync(req.file.path);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = req.file.mimetype;
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  // Extract data using OpenAI Vision
  const extractedData = await extractBillData(dataUrl);

  // Use netTotal for totalAmount (for gross sales calculation), fallback to total
  const totalValue = extractedData.netTotal || extractedData.total || null;

  const bill = await prisma.bill.create({
    data: {
      userId: req.userId!,
      imagePath,
      extractedData,
      totalAmount: totalValue ? new Decimal(totalValue) : null,
      billDate: billDate ? new Date(billDate) : new Date(),
      processedAt: new Date(),
    },
  });

  // Update daily sheet gross sales
  await updateDailySheetGrossSales(req.userId!, bill.billDate);

  res.status(201).json({
    success: true,
    data: { bill },
  });
});

export const updateBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { extractedData, totalAmount, billDate } = req.body;

  const bill = await prisma.bill.findFirst({
    where: { id, userId: req.userId },
  });

  if (!bill) {
    throw createError('Bill not found', 404);
  }

  const oldBillDate = bill.billDate;

  const updatedBill = await prisma.bill.update({
    where: { id },
    data: {
      ...(extractedData !== undefined && { extractedData }),
      ...(totalAmount !== undefined && { totalAmount: new Decimal(totalAmount) }),
      ...(billDate !== undefined && { billDate: new Date(billDate) }),
    },
  });

  // Update gross sales for affected dates
  await updateDailySheetGrossSales(req.userId!, updatedBill.billDate);
  if (oldBillDate.getTime() !== updatedBill.billDate.getTime()) {
    await updateDailySheetGrossSales(req.userId!, oldBillDate);
  }

  res.json({
    success: true,
    data: { bill: updatedBill },
  });
});

export const deleteBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const bill = await prisma.bill.findFirst({
    where: { id, userId: req.userId },
  });

  if (!bill) {
    throw createError('Bill not found', 404);
  }

  // Delete the image file
  const fullPath = path.join(__dirname, '../..', bill.imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  await prisma.bill.delete({ where: { id } });

  // Update daily sheet gross sales
  await updateDailySheetGrossSales(req.userId!, bill.billDate);

  res.json({
    success: true,
    message: 'Bill deleted successfully',
  });
});

async function updateDailySheetGrossSales(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const result = await prisma.bill.aggregate({
    where: {
      userId,
      billDate: startOfDay,
      totalAmount: { not: null },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const grossSales = result._sum.totalAmount || new Decimal(0);

  await prisma.dailySheet.upsert({
    where: {
      userId_sheetDate: {
        userId,
        sheetDate: startOfDay,
      },
    },
    update: { grossSales },
    create: {
      userId,
      sheetDate: startOfDay,
      grossSales,
    },
  });
}
