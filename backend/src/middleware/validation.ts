import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

// Auth validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  handleValidationErrors,
];

export const validateRegister = [
  body('companyName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  handleValidationErrors,
];

// User validation
export const validateCreateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  handleValidationErrors,
];

export const validateUpdateUser = [
  param('id').isUUID().withMessage('Valid user ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

// Project validation
export const validateCreateProject = [
  body('name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Project name must be between 2 and 255 characters'),
  body('address')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  body('type')
    .isIn(['New Construction', 'Renovation', 'Demolition', 'Interior Fit-Out'])
    .withMessage('Invalid project type'),
  body('status')
    .optional()
    .isIn(['In Progress', 'Completed', 'On Hold'])
    .withMessage('Invalid project status'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('markupPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Markup percent must be between 0 and 100'),
  handleValidationErrors,
];

export const validateUpdateProject = [
  param('id').isUUID().withMessage('Valid project ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Project name must be between 2 and 255 characters'),
  body('address')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  body('type')
    .optional()
    .isIn(['New Construction', 'Renovation', 'Demolition', 'Interior Fit-Out'])
    .withMessage('Invalid project type'),
  body('status')
    .optional()
    .isIn(['In Progress', 'Completed', 'On Hold'])
    .withMessage('Invalid project status'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('markupPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Markup percent must be between 0 and 100'),
  handleValidationErrors,
];

// Task validation
export const validateCreateTask = [
  body('title')
    .isLength({ min: 2, max: 255 })
    .withMessage('Task title must be between 2 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('projectId')
    .isUUID()
    .withMessage('Valid project ID is required'),
  body('assigneeId')
    .isUUID()
    .withMessage('Valid assignee ID is required'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date is required'),
  handleValidationErrors,
];

export const validateUpdateTask = [
  param('id').isUUID().withMessage('Valid task ID is required'),
  body('title')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Task title must be between 2 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Valid assignee ID is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'Done'])
    .withMessage('Invalid task status'),
  handleValidationErrors,
];

// Time log validation
export const validateClockIn = [
  body('projectId')
    .isUUID()
    .withMessage('Valid project ID is required'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors,
];

// Inventory validation
export const validateCreateInventoryItem = [
  body('name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Item name must be between 2 and 255 characters'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('unit')
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),
  handleValidationErrors,
];

export const validateUpdateInventoryItem = [
  param('id').isUUID().withMessage('Valid inventory item ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Item name must be between 2 and 255 characters'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('unit')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// UUID parameter validation
export const validateUUID = (paramName: string) => [
  param(paramName).isUUID().withMessage(`Valid ${paramName} is required`),
  handleValidationErrors,
];
