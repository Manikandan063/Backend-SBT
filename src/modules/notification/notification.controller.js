import * as notificationService from './notification.service.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';
import Student from '../student/student.model.js';

export const sendNotification = async (req, res, next) => {
  try {
    const logData = `[${new Date().toISOString()}] BODY: ${JSON.stringify(req.body)} | USER: ${JSON.stringify(req.user)}\n`;
    import('fs').then(fs => {
      fs.appendFileSync('debug_notifications.log', logData);
    });
    console.log('[NOTIFICATION] Send Request Body:', req.body);
    console.log('[NOTIFICATION] User from Token:', req.user);

    const { title, body, type, targetType, targetId, scheduledAt } = req.body;
    const schoolId = req.user.schoolId;
    const adminId = req.user.id;

    if (!title || !body) {
      throw new AppError('Title and message body are required', 400);
    }

    let notification;
    if (targetType === 'bus') {
      if (!targetId || targetId === '') throw new AppError('Bus ID is required for targeted alerts', 400);
      notification = await notificationService.sendToBusRoute(schoolId, adminId, { busId: targetId, title, body, type, scheduledAt });
    } else {
      notification = await notificationService.broadcastToAll(schoolId, adminId, { title, body, type, scheduledAt });
    }

    res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    let schoolId = null;

    if (userRole === 'superadmin') {
      schoolId = req.query.schoolId || null;
    } else {
      schoolId = req.user.schoolId;
      if (!schoolId) {
        console.warn(`[Security] User ${req.user.email} (Role: ${userRole}) attempted to access notification history without a schoolId!`);
        return res.status(200).json({
          status: 'success',
          data: [],
          message: 'No school associated with this account. Access restricted.'
        });
      }
    }

    const history = await notificationService.getHistory(schoolId);
    
    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getParentNotifications = async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const tokenSchoolId = req.user.schoolId;

    // 1. Get all bus IDs and school IDs associated with the parent's children
    const students = await Student.findAll({
      where: { parentId },
      attributes: ['currentBusId', 'schoolId']
    });
    
    const busIds = students.map(s => s.currentBusId).filter(Boolean);
    const studentSchoolIds = students.map(s => s.schoolId).filter(Boolean);
    
    // Combine schoolId from token and from students to be safe
    const allSchoolIds = [...new Set([tokenSchoolId, ...studentSchoolIds])].filter(Boolean);

    // DEBUG: Log to file
    import('fs').then(fs => {
      fs.appendFileSync('debug_notifications.log', `[${new Date().toISOString()}] PARENT_GET: Parent=${parentId} | Schools=${JSON.stringify(allSchoolIds)} | Buses=${JSON.stringify(busIds)}\n`);
    });

    // 2. Fetch notifications
    const notifications = await notificationService.getParentNotifications(allSchoolIds, busIds, parentId);
    
    // DEBUG: Log to file
    import('fs').then(fs => {
      fs.appendFileSync('debug_notifications.log', `[${new Date().toISOString()}] PARENT_GET: Parent=${parentId} | Found=${notifications.length} | Schools=${JSON.stringify(allSchoolIds)} | Buses=${JSON.stringify(busIds)}\n`);
    });

    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    console.error('[NOTIFICATION_CONTROLLER_ERROR]:', error);
    next(error);
  }
};

export const dismissNotification = async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const { notificationId } = req.body;

    if (!notificationId) {
      throw new AppError('Notification ID is required', 400);
    }

    await notificationService.dismissNotification(parentId, notificationId);

    res.status(200).json({
      status: 'success',
      message: 'Notification successfully dismissed'
    });
  } catch (error) {
    next(error);
  }
};

export const undodismissNotification = async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const { notificationId } = req.body;

    if (!notificationId) {
      throw new AppError('Notification ID is required', 400);
    }

    await notificationService.undodismissNotification(parentId, notificationId);

    res.status(200).json({
      status: 'success',
      message: 'Notification successfully restored'
    });
  } catch (error) {
    next(error);
  }
};


