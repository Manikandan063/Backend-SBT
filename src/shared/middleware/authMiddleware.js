import { verifyToken } from '../auth/jwt.js';
import { AppError } from '../errorHandling/errorHandler.js';
import { School } from '../../models/initModels.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new AppError('Invalid token or token has expired.', 401));
    }

    // Check if the user's school is blocked (applies to all non-superadmin users)
    if (decoded.role !== 'superadmin' && decoded.schoolId) {
      const school = await School.findByPk(decoded.schoolId);
      if (school && school.status === 'blocked') {
        return next(new AppError('Your access is blocked. Contact XTOWN', 403));
      }
    }

    // Attach user to request
    req.user = decoded;
    
    // DEBUG LOG
    console.log(`[AUTH] Authenticated: ID=${decoded.id}, Role=${decoded.role}`);
    
    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};
