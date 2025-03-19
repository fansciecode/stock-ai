import { body } from 'express-validator';

export const createPaymentValidator = [
    body('amount')
        .isInt({ min: 1 })
        .withMessage('Amount must be a positive integer'),
    body('currency')
        .optional()
        .isIn(['usd', 'eur', 'gbp'])
        .withMessage('Invalid currency'),
    body('description')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Description must be a non-empty string'),
    body('type')
        .isIn(['event_payment', 'subscription', 'event_upgrade'])
        .withMessage('Invalid payment type')
];

export const confirmPaymentValidator = [
    body('paymentIntentId')
        .isString()
        .notEmpty()
        .withMessage('Payment intent ID is required'),
    body('paymentMethodId')
        .isString()
        .notEmpty()
        .withMessage('Payment method ID is required')
]; 