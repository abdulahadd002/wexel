import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { generateExcelSheet } from '../services/excelService';

export const getSheets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const where: any = { userId: req.userId };

  if (startDate && endDate) {
    where.sheetDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const sheets = await prisma.dailySheet.findMany({
    where,
    orderBy: { sheetDate: 'desc' },
  });

  res.json({
    success: true,
    data: { sheets },
  });
});

export const getSheetByDate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.params;
  const sheetDate = new Date(date);
  sheetDate.setHours(0, 0, 0, 0);

  const sheet = await prisma.dailySheet.findUnique({
    where: {
      userId_sheetDate: {
        userId: req.userId!,
        sheetDate,
      },
    },
  });

  const bills = await prisma.bill.findMany({
    where: {
      userId: req.userId,
      billDate: sheetDate,
    },
    include: {
      contact: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    success: true,
    data: {
      sheet: sheet || { sheetDate, grossSales: 0 },
      bills,
    },
  });
});

export const exportSheet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.params;
  const sheetDate = new Date(date);
  sheetDate.setHours(0, 0, 0, 0);

  const bills = await prisma.bill.findMany({
    where: {
      userId: req.userId,
      billDate: sheetDate,
    },
    include: {
      contact: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (bills.length === 0) {
    throw createError('No bills found for this date', 404);
  }

  const buffer = await generateExcelSheet(bills, sheetDate);

  const filename = `wexel-sheet-${date}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const getGrossSales = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period } = req.query;

  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  const sheets = await prisma.dailySheet.findMany({
    where: {
      userId: req.userId,
      sheetDate: { gte: startDate },
    },
    orderBy: { sheetDate: 'desc' },
  });

  const totalGrossSales = sheets.reduce(
    (sum, sheet) => sum + Number(sheet.grossSales),
    0
  );

  res.json({
    success: true,
    data: {
      period: period || 'all',
      totalGrossSales,
      sheets,
    },
  });
});
