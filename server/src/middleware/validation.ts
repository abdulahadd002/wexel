import { body, param, validationResult } from 'express-validator';
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

export const billValidation = {
  update: [
    param('id').isUUID().withMessage('Invalid bill ID'),
    body('extractedData').optional().isObject().withMessage('extractedData must be an object'),
    body('totalAmount').optional().isDecimal().withMessage('totalAmount must be a decimal'),
    body('billDate').optional().isISO8601().withMessage('billDate must be a valid date'),
    validate,
  ],
};

export const sheetValidation = {
  getByDate: [
    param('date').isISO8601().withMessage('Invalid date format'),
    validate,
  ],
};
