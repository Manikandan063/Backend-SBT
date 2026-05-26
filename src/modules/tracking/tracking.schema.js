import { z } from 'zod';
import { mobileValidation, safeStringValidation } from '../../shared/utils/validation.util.js';

export const liveLocationSchema = z.object({
  gpsDeviceId: safeStringValidation('GPS Device ID').optional(),
  busId: z.string().uuid().optional(),
  driverMobileNumber: z.union([mobileValidation('Driver mobile number'), z.literal('')]).optional(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional().default(0),
  status: safeStringValidation('Status').optional(),
  timestamp: z.string().optional(), // Devices might send their own timestamp
});
