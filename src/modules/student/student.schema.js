import { z } from 'zod';
import { nameValidation, mobileValidation, emailValidation, passwordValidation, safeStringValidation } from '../../shared/utils/validation.util.js';

export const createStudentSchema = z.object({
  studentName: nameValidation('Student name'),
  rollNo: safeStringValidation('Roll number').min(1, 'Roll number is required'),
  class: safeStringValidation('Class').min(1, 'Class is required'),
  section: safeStringValidation('Section').min(1, 'Section is required'),
  gender: z.enum(['Male', 'Female', 'Other']).optional().default('Male'),
  address: safeStringValidation('Address').optional().default('Not Provided'),
  pickupPoint: safeStringValidation('Pickup point').min(1, 'Pickup point is required'),
  schoolId: z.string().uuid('Invalid school ID').optional(),
  currentBusId: z.preprocess((val) => (val === '' ? null : val), z.string().uuid('Invalid bus ID').optional().nullable()),
  pickupLat: z.preprocess((val) => (val === '' ? null : val === null ? null : Number(val)), z.number().optional().nullable()),
  pickupLng: z.preprocess((val) => (val === '' ? null : val === null ? null : Number(val)), z.number().optional().nullable()),

  // Nested Parent Details
  parent: z.object({
    parentName: nameValidation('Parent name'),
    mobileNumber: mobileValidation('Mobile number'),
    email: emailValidation('Email'),
    password: z.union([passwordValidation('Password'), z.literal('')]).optional(),
    address: safeStringValidation('Address').optional().default('Not Provided')
  })
});

export const updateStudentSchema = createStudentSchema.partial();

