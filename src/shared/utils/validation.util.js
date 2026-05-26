import { z } from 'zod';

export const nameValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .min(3, `${fieldName} must be at least 3 characters long`)
  .max(100, `${fieldName} cannot exceed 100 characters`)
  .regex(/^[a-zA-Z.'\-]+(?: [a-zA-Z.'\-]+)*$/, `${fieldName} must contain only alphabets, dots, hyphens, and single spaces`);

export const schoolNameValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .min(3, `${fieldName} must be at least 3 characters long`)
  .max(100, `${fieldName} cannot exceed 100 characters`)
  .regex(/^[a-zA-Z0-9.'\-]+(?: [a-zA-Z0-9.'\-]+)*$/, `${fieldName} must contain only alphabets, numbers, dots, hyphens, and single spaces`);

export const mobileValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .regex(/^[0-9]{10}$/, `${fieldName} must be exactly 10 digits`);

export const busNumberValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9\- ]+$/, `${fieldName} can only contain uppercase letters, numbers, hyphens, and spaces`);


export const routeNameValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .regex(/^[a-zA-Z0-9 \-]+$/, `${fieldName} can only contain alphabets, numbers, spaces, and hyphens`);

export const emailValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .toLowerCase()
  .email(`Invalid ${fieldName.toLowerCase()} format`);

export const passwordValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .min(8, `${fieldName} must be at least 8 characters long`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, `${fieldName} must contain at least one uppercase, one lowercase, one number and one special character`);

// Reusable XSS safe string validation for other general text fields
export const safeStringValidation = (fieldName) => z.string({ required_error: `${fieldName} is required` })
  .trim()
  .regex(/^[^<>`]*$/, `${fieldName} contains invalid characters`);
