import { body, param } from 'express-validator';

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