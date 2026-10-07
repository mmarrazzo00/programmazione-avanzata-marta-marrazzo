import { body } from 'express-validator';

export const createUserRules = [
    body('username')
        .isString()
        .withMessage('Username must be a string')
        .bail()
        .notEmpty()
        .withMessage('Username is required'),

    body('email')
        .isEmail()
        .withMessage('Invalid email')
        .bail()
        .notEmpty()
        .withMessage('Email is required'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

export const updateUserRules = [
    body('username')
        .optional()
        .isString()
        .withMessage('Username must be a string')
        .bail()
        .notEmpty()
        .withMessage('Username is required'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email'),

    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Invalid role'),
];

export const updateCreditRules = [
    body('email')
        .isEmail()
        .withMessage('Invalid email'),

    body('credit')
        .isFloat({ min: 0 })
        .withMessage('Credit must be a non-negative number')
];