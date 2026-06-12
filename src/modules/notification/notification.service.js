import admin from '../../config/firebase.js';
import Notification from './notification.model.js';
import Parent from '../parent/parent.model.js';
import Student from '../student/student.model.js';
import DismissedNotification from './dismissedNotification.model.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';
import { Op } from 'sequelize';

/**
 * Send notification to multiple parents via FCM
 */
const sendFCMNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return 0;

  // Filter out null or empty tokens
  const validTokens = tokens.filter(t => t && t.length > 5);
  if (validTokens.length === 0) return 0;

  try {
    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens: validTokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`[FCM] Successfully sent ${response.successCount} messages`);

    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(validTokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        console.warn(`[FCM] Removing ${failedTokens.length} invalid tokens.`);
        await Parent.update(
          { fcmToken: null },
          { where: { fcmToken: { [Op.in]: failedTokens } } }
        );
      }
    }

    return response.successCount;
  } catch (error) {
    console.error('[FCM] Error sending multicast message:', error);
    return 0;
  }
};

/**
 * Broadcast notification to all parents of a school
 */
export const broadcastToAll = async (schoolId, adminId, { title, body, type, scheduledAt }) => {
  // 1. Fetch all unique parents who have an FCM token
  // If schoolId is provided, filter by school; otherwise fetch all (Super Admin)
  const studentWhere = schoolId ? { schoolId } : {};
  
  const students = await Student.findAll({
    where: studentWhere,
    include: [{ 
      model: Parent, 
      as: 'parent', 
      attributes: ['id', 'fcmToken'],
      where: { fcmToken: { [Op.ne]: null } }
    }]
  });
  
  // Extract unique tokens
  const tokens = [...new Set(students.map(s => s.parent?.fcmToken).filter(Boolean))];
  
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  // 2. Create history record
  const notification = await Notification.create({
    title,
    body,
    type,
    targetType: 'all',
    schoolId: schoolId || null,
    sentBy: adminId,
    status: isScheduled ? 'scheduled' : 'sent',
    scheduledAt: scheduledAt || null
  });

  // 3. Send via FCM if not scheduled
  if (!isScheduled) {
    await sendFCMNotification(tokens, title, body, { type, notificationId: notification.id });
  }

  return notification;
};

/**
 * Send notification to parents of a specific bus route
 */
export const sendToBusRoute = async (schoolId, adminId, { busId, title, body, type, scheduledAt }) => {
  // 1. Find all students on this bus
  const students = await Student.findAll({
    where: { currentBusId: busId },
    include: [{ model: Parent, as: 'parent', attributes: ['fcmToken'] }]
  });

  // 2. Extract unique parent tokens
  const tokens = [...new Set(students.map(s => s.parent?.fcmToken).filter(Boolean))];

  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  // 3. Create history record
  const notification = await Notification.create({
    title,
    body,
    type,
    targetType: 'bus',
    targetId: busId,
    schoolId,
    sentBy: adminId,
    status: isScheduled ? 'scheduled' : 'sent',
    scheduledAt: scheduledAt || null
  });

  // 4. Send via FCM if not scheduled
  if (!isScheduled) {
    await sendFCMNotification(tokens, title, body, { type, busId, notificationId: notification.id });
  }

  return notification;
};

/**
 * Process all scheduled notifications whose time has passed
 */
export const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    const scheduledNotifications = await Notification.findAll({
      where: {
        status: 'scheduled',
        scheduledAt: { [Op.lte]: now }
      }
    });

    for (const notification of scheduledNotifications) {
      if (notification.targetType === 'bus') {
        const students = await Student.findAll({
          where: { currentBusId: notification.targetId },
          include: [{ model: Parent, as: 'parent', attributes: ['fcmToken'] }]
        });
        const tokens = [...new Set(students.map(s => s.parent?.fcmToken).filter(Boolean))];
        await sendFCMNotification(tokens, notification.title, notification.body, { type: notification.type, busId: notification.targetId, notificationId: notification.id });
      } else {
        const studentWhere = notification.schoolId ? { schoolId: notification.schoolId } : {};
        const students = await Student.findAll({
          where: studentWhere,
          include: [{ model: Parent, as: 'parent', attributes: ['fcmToken'] }]
        });
        const tokens = [...new Set(students.map(s => s.parent?.fcmToken).filter(Boolean))];
        await sendFCMNotification(tokens, notification.title, notification.body, { type: notification.type, notificationId: notification.id });
      }
      
      notification.status = 'sent';
      await notification.save();
    }
  } catch (error) {
    console.error('[CRON] Error processing scheduled notifications:', error);
  }
};

/**
 * Get notification history for a school
 */
export const getHistory = async (schoolId) => {
  return await Notification.findAll({
    where: { schoolId },
    order: [['createdAt', 'DESC']],
    limit: 50
  });
};

/**
 * Get notifications for a parent based on their school and child bus routes
 */
export const getParentNotifications = async (schoolIds = [], busIds = [], parentId = null) => {
  // Ensure schoolIds is an array
  const ids = Array.isArray(schoolIds) ? schoolIds : [schoolIds].filter(Boolean);
  
  // Find dismissed notification IDs for this parent
  let dismissedIds = [];
  if (parentId) {
    const dismissals = await DismissedNotification.findAll({
      where: { parentId },
      attributes: ['notificationId']
    });
    dismissedIds = dismissals.map(d => d.notificationId);
  }

  const whereClause = {
    [Op.or]: [
      { 
        schoolId: { [Op.in]: ids },
        targetType: 'all' 
      },
      { 
        schoolId: null,
        targetType: 'all' 
      },
      { 
        targetType: 'bus', 
        targetId: { [Op.in]: busIds } 
      }
    ]
  };

  if (dismissedIds.length > 0) {
    whereClause.id = { [Op.notIn]: dismissedIds };
  }
  
  const results = await Notification.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: 50
  });

  console.log(`[NOTIFICATION_SERVICE] Found ${results.length} active notifications for Parent. Querying Schools: ${JSON.stringify(ids)} | Buses: ${JSON.stringify(busIds)} | Excluded Dismissed: ${dismissedIds.length}`);
  return results;
};

/**
 * Mark a notification as dismissed for a parent
 */
export const dismissNotification = async (parentId, notificationId) => {
  const existing = await DismissedNotification.findOne({
    where: { parentId, notificationId }
  });
  if (existing) return existing;

  return await DismissedNotification.create({
    parentId,
    notificationId
  });
};

/**
 * Restore a dismissed notification for a parent
 */
export const undodismissNotification = async (parentId, notificationId) => {
  return await DismissedNotification.destroy({
    where: { parentId, notificationId }
  });
};


