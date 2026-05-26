import { z } from 'zod';
import { safeStringValidation } from '../../shared/utils/validation.util.js';

export const transferStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  newBusId: z.string().uuid('Invalid bus ID'),
  reason: safeStringValidation('Reason').min(5, 'Reason must be at least 5 characters'),
  updatedBy: z.string().uuid('Invalid admin ID').optional(),
});

export const emergencyTransferSchema = z.object({
  oldBusId: z.string().uuid('Invalid old bus ID'),
  newBusId: z.string().uuid('Invalid new bus ID'),
  reason: safeStringValidation('Reason').min(5, 'Reason must be at least 5 characters'),
  status: z.enum(['breakdown', 'active']).default('breakdown'),
});
