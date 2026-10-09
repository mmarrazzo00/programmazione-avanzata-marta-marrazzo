import { body, param, query } from 'express-validator';

//regole di validazione per la creazione della richiesta di aggiornamento di una matrice
export const createUpdateRequestRules = [

    param('modelId')
        .notEmpty()
        .withMessage('modelId is required')
        .isString()
        .withMessage('modelId must be a string'),

    body()
        .isArray({ min: 1 })
        .withMessage('updates must be a non-empty array'),

    body('*.row')
        .isInt({ min: 0 })
        .withMessage('row must be a non-negative integer'),

    body('*.column')
        .isInt({ min: 0 })
        .withMessage('column must be a non-negative integer'),

    body('*.newValue')
        .isInt({ min: 0, max: 1 })
        .withMessage('newValue must be 0 or 1'),
];


export const updateRequestDecisionRules = [
    param('requestId')
        .isInt({ min: 1 })
        .withMessage('requestId must be a positive integer'),

    body('accept')
        .custom(value => typeof value === 'boolean')
        .withMessage('accept must be a boolean')
];

export const updateHistoryRules = [
    param('modelId').isString().notEmpty().withMessage('modelId is required'),
    query('startDate').optional()
        .isISO8601({ strict: true }).withMessage('startDate must be a valid ISO 8601 date'),
    query('endDate')
        .optional().
        isISO8601({ strict: true })
        .withMessage('endDate must be a valid ISO 8601 date'),
    query('status')
        .optional().isIn(['accepted', 'rejected', 'pending', 'auto'])
        .withMessage('status must be accepted, rejected, pending or auto'),];