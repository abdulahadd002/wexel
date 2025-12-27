import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { config } from '../config/env';
import { fetchMediaUrl, downloadMedia } from '../services/whatsappService';

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
};

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    res.sendStatus(404);
    return;
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'messages') {
        const value = change.value;
        const messages = value.messages || [];

        for (const message of messages) {
          if (message.type === 'image') {
            await processIncomingImage(
              message.from,
              message.image.id,
              message.timestamp
            );
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

async function processIncomingImage(
  fromNumber: string,
  mediaId: string,
  timestamp: string
) {
  try {
    const contacts = await prisma.whatsAppContact.findMany({
      where: {
        phoneNumber: fromNumber,
        isActive: true,
      },
    });

    if (contacts.length === 0) {
      console.log(`No active contacts found for ${fromNumber}`);
      return;
    }

    const mediaUrl = await fetchMediaUrl(mediaId);
    const imageData = await downloadMedia(mediaUrl);

    console.log(`Received image from ${fromNumber}, media ID: ${mediaId}`);
  } catch (error) {
    console.error('Error processing incoming image:', error);
  }
}

export const getContactPhotos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contactId } = req.params;

  const contact = await prisma.whatsAppContact.findFirst({
    where: { id: contactId, userId: req.userId },
  });

  if (!contact) {
    throw createError('Contact not found', 404);
  }

  const bills = await prisma.bill.findMany({
    where: {
      userId: req.userId,
      contactId,
    },
    select: {
      id: true,
      imageUrl: true,
      billDate: true,
      processedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: {
      contact,
      photos: bills,
    },
  });
});

export const getAllPhotos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [photos, total] = await Promise.all([
    prisma.bill.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        imageUrl: true,
        billDate: true,
        processedAt: true,
        createdAt: true,
        contact: {
          select: {
            id: true,
            displayName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.bill.count({ where: { userId: req.userId } }),
  ]);

  res.json({
    success: true,
    data: {
      photos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});
