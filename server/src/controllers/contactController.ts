import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

export const getContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contacts = await prisma.whatsAppContact.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: { contacts },
  });
});

export const getContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const contact = await prisma.whatsAppContact.findFirst({
    where: { id, userId: req.userId },
  });

  if (!contact) {
    throw createError('Contact not found', 404);
  }

  res.json({
    success: true,
    data: { contact },
  });
});

export const createContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber, displayName } = req.body;

  const existingContact = await prisma.whatsAppContact.findFirst({
    where: { userId: req.userId, phoneNumber },
  });

  if (existingContact) {
    throw createError('Contact with this phone number already exists', 400);
  }

  const contact = await prisma.whatsAppContact.create({
    data: {
      userId: req.userId!,
      phoneNumber,
      displayName,
    },
  });

  res.status(201).json({
    success: true,
    data: { contact },
  });
});

export const updateContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { displayName, isActive } = req.body;

  const contact = await prisma.whatsAppContact.findFirst({
    where: { id, userId: req.userId },
  });

  if (!contact) {
    throw createError('Contact not found', 404);
  }

  const updatedContact = await prisma.whatsAppContact.update({
    where: { id },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({
    success: true,
    data: { contact: updatedContact },
  });
});

export const deleteContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const contact = await prisma.whatsAppContact.findFirst({
    where: { id, userId: req.userId },
  });

  if (!contact) {
    throw createError('Contact not found', 404);
  }

  await prisma.whatsAppContact.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Contact deleted successfully',
  });
});
