import express from 'express';
import * as notificationController from './notification.controller.js';
import { authMiddleware } from '../../shared/middleware/authMiddleware.js';
import { roleMiddleware } from '../../shared/middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/send', roleMiddleware('school_admin', 'superadmin'), notificationController.sendNotification);
router.get('/history', roleMiddleware('school_admin', 'superadmin'), notificationController.getHistory);
router.get('/parent', roleMiddleware('parent', 'school_admin', 'superadmin'), notificationController.getParentNotifications);
router.post('/dismiss', roleMiddleware('parent'), notificationController.dismissNotification);
router.post('/undodismiss', roleMiddleware('parent'), notificationController.undodismissNotification);



export default router;
