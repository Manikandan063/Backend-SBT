import { AppError } from '../errorHandling/errorHandler.js';

export const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role?.toLowerCase().replace('-', '_');
    const normalizedRoles = roles.map(r => r.toLowerCase().replace('-', '_'));

    if (!normalizedRoles.includes(userRole)) {
      const errorMsg = `[RoleMiddleware] ACCESS DENIED:
        - User Role: '${req.user.role}' (Normalized: '${userRole}')
        - Required Roles: [${roles.join(', ')}]
        - Endpoint: ${req.method} ${req.originalUrl || req.url}`;
      
      console.error(errorMsg);
      import('fs').then(fs => {
        fs.appendFileSync('error_runtime.log', `[${new Date().toISOString()}] ${errorMsg}\n`);
      });
      return next(new AppError('Permission Denied: Insufficient Role Privileges', 403));
    }
    next();
  };
};
