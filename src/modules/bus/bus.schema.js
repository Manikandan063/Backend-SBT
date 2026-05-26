import { z } from 'zod';
import { busNumberValidation, nameValidation, mobileValidation, routeNameValidation, safeStringValidation } from '../../shared/utils/validation.util.js';

export const createBusSchema = z.object({
  busRegisterNumber: busNumberValidation('Bus registration number'),
  busNumber: busNumberValidation('Bus number'),
  capacity: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().min(1).optional().default(40)),
  routeName: routeNameValidation('Route name').optional().default('Main Route'),
  schoolId: z.string().uuid('Invalid school ID'),
  driverName: z.union([nameValidation('Driver name'), z.literal('')]).optional().nullable(),
  driverMobileNumber: z.union([mobileValidation('Driver mobile number'), z.literal('')]).optional().nullable(),
  gpsDeviceId: safeStringValidation('GPS Device ID').optional().nullable(),
  gpsProvider: z.preprocess((val) => typeof val === 'string' ? val.toUpperCase() : val, z.enum(['TRACCAR', 'SIMULATED', 'STANDARD', 'ENTERPRISE']).optional().default('SIMULATED')),
  deviceIdentifier: safeStringValidation('Device Identifier').optional().nullable(),
  trackingStatus: z.preprocess((val) => typeof val === 'string' ? val.toUpperCase() : val, z.enum(['ACTIVE', 'OFFLINE', 'INACTIVE', 'SCHOOL_HOURS_ONLY']).optional().default('INACTIVE')),
  status: z.preprocess((val) => typeof val === 'string' ? val.toUpperCase() : val, z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE')),
  morningStartTime: safeStringValidation('Morning start time').optional().nullable(),
  eveningStartTime: safeStringValidation('Evening start time').optional().nullable(),
});

export const updateBusSchema = createBusSchema.partial();
