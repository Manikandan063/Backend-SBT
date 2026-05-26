import express from 'express';
import * as parentController from './parent.controller.js';
import { authMiddleware } from '../../shared/middleware/authMiddleware.js';
import { roleMiddleware } from '../../shared/middleware/roleMiddleware.js';

const router = express.Router();

console.log('[ROUTES] Initializing Parent Routes...');
import('fs').then(fs => {
  fs.appendFileSync('startup.log', `[${new Date().toISOString()}] [ROUTES] Initializing Parent Routes...\n`);
});

/**
 * @route   GET /api/parents/profile
 * @desc    Get parent dashboard/profile data
 * @access  Private (Parent)
 */
router.get('/profile', authMiddleware, roleMiddleware('parent', 'school_admin', 'superadmin'), parentController.getProfile);

/**
 * @route   PATCH /api/parents/profile
 * @desc    Update parent's own profile
 * @access  Private (Parent)
 */
router.patch('/profile', authMiddleware, parentController.updateProfile);

/**
 * @route   POST /api/parents/login
 * @desc    Parent login to access dashboard
 * @access  Public
 */
router.post('/login', parentController.login);

/**
 * @route   POST /api/parents/logout
 * @desc    Parent logout (clears active session)
 * @access  Private (Parent)
 */
router.post('/logout', authMiddleware, parentController.logout);

/**
 * @route   PATCH /api/parents/fcm-token
 * @desc    Update parent's FCM token for push notifications
 * @access  Private (Parent)
 */
router.patch('/fcm-token', authMiddleware, parentController.updateFcmToken);

/**
 * @route   PATCH /api/parents/:id
 * @desc    Admin update parent details
 * @access  Private (Admin)
 */
router.patch('/:id', authMiddleware, roleMiddleware('superadmin', 'school_admin'), parentController.adminUpdateParent);

/**
 * @route   GET /api/parents
 * @desc    Get all parents (Admin)
 * @access  Private (Admin)
 */
router.get('/', authMiddleware, roleMiddleware('superadmin', 'school_admin'), parentController.getAllParents);

/* ==========================================
   ADDED CODE: Smart School Assistant Popup
   ========================================== */
/**
 * @route   GET /api/parents/smart-assistant/:studentId
 * @desc    Get smart-assistant updates for child
 * @access  Private (Parent)
 */
router.get('/smart-assistant/:studentId', authMiddleware, parentController.getSmartAssistant);

export default router;
