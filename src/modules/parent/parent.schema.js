import { z } from 'zod';
import { mobileValidation } from '../../shared/utils/validation.util.js';

export const parentLoginSchema = z.object({
  mobileNumber: mobileValidation('Mobile number'),
  password: z.string().min(1, 'Password is required'),
  force: z.boolean().optional(),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});
