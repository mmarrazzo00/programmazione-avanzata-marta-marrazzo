import { body } from 'express-validator';

export const createModelRules = [
    body('modelId')
        .notEmpty()
        .withMessage('modelId is required')
        .isString()
        .withMessage('modelId must be a string'),

    body('name')
        .notEmpty()
        .withMessage('name is required')
        .isString()
        .withMessage('name must be a string'),

    body('matrix')
        .notEmpty()
        .withMessage('matrix is required')
        .isArray({ min: 1 })
        .withMessage('matrix must be a non-empty array'),

    body('matrix.*')
        .isArray({ min: 1 })
        .withMessage('Each matrix row must be a non-empty array'),

    body('matrix.*.*')
        .isInt({ min: 0, max: 1 })
        .withMessage('Matrix values must be 0 or 1'),
];