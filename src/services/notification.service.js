import admin from '../config/firebase.js';

/**
 * Send a push notification to a specific device token
 * @param {string} fcmToken - The target device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 * @returns {Promise<string>} - Message ID
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.warn('[Notification] No FCM token provided for user');
    return null;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // Standard for many clients
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[Notification] Sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[Notification] Error sending message:', error.message);
    
    // Handle specific FCM errors (e.g., token expired)
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('[Notification] FCM token is no longer valid. User should re-register.');
    }
    
    return null;
  }
};

/**
 * Send notification for specific bus events
 */
export const sendBusAlert = async (parent, eventType, busNumber) => {
  const alerts = {
    'BUS_ARRIVING': {
      title: 'Bus Arriving Soon 🚌',
      body: `School bus ${busNumber} is within 2 KM of your pickup point.`
    },
    'TRIP_STARTED': {
      title: 'Trip Started 🚩',
      body: `School bus ${busNumber} has started its journey.`
    },
    'STUDENT_PICKED_UP': {
      title: 'Student Boarded ✅',
      body: `Your child has successfully boarded bus ${busNumber}.`
    },
    'STUDENT_REACHED': {
      title: 'Reached School 🏫',
      body: `Your child has safely reached the school.`
    },
    'EMERGENCY': {
      title: 'Urgent: Bus Alert ⚠️',
      body: `There is an emergency update for bus ${busNumber}. Please check the app.`
    }
  };

  const alert = alerts[eventType];
  if (!alert) return null;

  return sendPushNotification(
    parent.fcmToken,
    alert.title,
    alert.body,
    { eventType, busNumber }
  );
};

export default {
  sendPushNotification,
  sendBusAlert
};
