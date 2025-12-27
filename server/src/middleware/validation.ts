import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    next(createError(errorMessages, 400));
    return;
  }
  next();
};

export const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validate,
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
};

export const contactValidation = {
  create: [
    body('phoneNumber')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number in E.164 format'),
    body('displayName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name is required and must be under 100 characters'),
    validate,
  ],
  update: [
    param('id').isUUID().withMessage('Invalid contact ID'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be under 100 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validate,
  ],
  delete: [
    param('id').isUUID().withMessage('Invalid contact ID'),
    validate,
  ],
};

export const billValidation = {
  update: [
    param('id').isUUID().withMessage('Invalid bill ID'),
    body('extractedData').optional().isObject().withMessage('extractedData must be an object'),
    body('totalAmount').optional().isDecimal().withMessage('totalAmount must be a decimal'),
    body('billDate').optional().isISO8601().withMessage('billDate must be a valid date'),
    validate,
  ],
  process: [
    body('imageUrl').isURL().withMessage('Please provide a valid image URL'),
    body('contactId').isUUID().withMessage('Invalid contact ID'),
    validate,
  ],
};

export const sheetValidation = {
  getByDate: [
    param('date').isISO8601().withMessage('Invalid date format'),
    validate,
  ],
};
