import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { extractBillData } from '../services/openaiService';

export const getBills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contactId, date, startDate, endDate } = req.query;

  const where: any = { userId: req.userId };

  if (contactId) {
    where.contactId = contactId as string;
  }

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
    include: {
      contact: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
    },
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
    include: {
      contact: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!bill) {
    throw createError('Bill not found', 404);
  }

  res.json({
    success: true,
    data: { bill },
  });
});

export const processBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { imageUrl, contactId, billDate } = req.body;

  const contact = await prisma.whatsAppContact.findFirst({
    where: { id: contactId, userId: req.userId },
  });

  if (!contact) {
    throw createError('Contact not found', 404);
  }

  const extractedData = await extractBillData(imageUrl);

  const bill = await prisma.bill.create({
    data: {
      userId: req.userId!,
      contactId,
      imageUrl,
      extractedData,
      totalAmount: extractedData.total ? new Decimal(extractedData.total) : null,
      billDate: billDate ? new Date(billDate) : new Date(),
      processedAt: new Date(),
    },
    include: {
      contact: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
    },
  });

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
    include: {
      contact: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
    },
  });

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

  await prisma.bill.delete({ where: { id } });

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
