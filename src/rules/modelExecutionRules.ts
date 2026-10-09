
import { body, param } from 'express-validator';

export const modelExecutionRules = [
    param('modelId')
        .notEmpty()
        .withMessage('modelId is required'),

    body('start')
        .isObject()
        .withMessage('start must be an object'),

    body('start.row')
        .isInt({ min: 0 })
        .withMessage('start.row must be a non-negative integer'),

    body('start.column')
        .isInt({ min: 0 })
        .withMessage('start.column must be a non-negative integer'),

    body('goal')
        .isObject()
        .withMessage('goal must be an object'),

    body('goal.row')
        .isInt({ min: 0 })
        .withMessage('goal.row must be a non-negative integer'),

    body('goal.column')
        .isInt({ min: 0 })
        .withMessage('goal.column must be a non-negative integer')
];