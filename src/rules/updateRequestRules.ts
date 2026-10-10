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
    param('modelId')
        .isString()
        .notEmpty()
        .withMessage('modelId is required'),
    query('FROM')
        .optional()
        .isISO8601()
        .withMessage('FROM must be a valid ISO 8601 date'),
    query('TO')
        .optional()
        .isISO8601()
        .withMessage('TO must be a valid ISO 8601 date'),
    query('STATUS')
        .optional()
        .isIn(['accepted', 'rejected', 'pending', 'auto'])
        .withMessage(
            'STATUS must be accepted, rejected, pending or auto'
        ),
    query('DATE_TYPE')
        .optional()
        .isIn(['createdAt', 'updatedAt'])
        .withMessage(
            'DATE_TYPE must be createdAt or updatedAt'
        )
];

export const modelPendingStatusRules = 
[ param('modelId') 
    .isString() 
    .trim() 
    .notEmpty() 
    .withMessage('modelId is required') ];