import express from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authMiddleware } from '../../shared/middleware/authMiddleware.js';
import { roleMiddleware } from '../../shared/middleware/roleMiddleware.js';

const router = express.Router();

router.get('/test', (req, res) => res.json({ message: 'Dashboard route is working' }));
router.get('/', authMiddleware, roleMiddleware('parent'), dashboardController.getDashboard);
router.get('/superadmin', authMiddleware, roleMiddleware('superadmin'), dashboardController.getSuperAdminStats);
router.get('/superadmin/report', authMiddleware, roleMiddleware('superadmin'), dashboardController.getSuperAdminReport);
router.get('/school-admin', authMiddleware, roleMiddleware('superadmin', 'school_admin'), dashboardController.getSchoolAdminStats);


export default router;
