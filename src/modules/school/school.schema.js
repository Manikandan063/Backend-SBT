import { z } from 'zod';
import { nameValidation, schoolNameValidation, mobileValidation, emailValidation, passwordValidation, safeStringValidation } from '../../shared/utils/validation.util.js';

export const createSchoolSchema = z.object({
  schoolName: schoolNameValidation('School name'),
  address: safeStringValidation('Address').min(1, 'Address is required'),
  phone: mobileValidation('Phone'),
  email: emailValidation('Email'),
  principalName: nameValidation('Principal name'),
  boardType: z.enum(['STATE', 'CBSE', 'ICSE', 'OTHER']).optional().default('STATE'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  adminName: nameValidation('Admin name').optional(),
  adminEmail: emailValidation('Admin email').optional(),
  adminPassword: z.union([passwordValidation('Admin password'), z.literal('')]).optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial();
