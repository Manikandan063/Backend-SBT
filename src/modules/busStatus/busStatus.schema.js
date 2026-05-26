import { z } from 'zod';

export const updateBusStatusSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional().default(0),
  status: z.enum(['moving', 'stopped', 'offline']).optional().default('offline'),
});
