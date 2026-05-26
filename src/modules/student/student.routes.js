import express from 'express';
import * as studentController from './student.controller.js';
import { authMiddleware } from '../../shared/middleware/authMiddleware.js';
import { roleMiddleware } from '../../shared/middleware/roleMiddleware.js';
import { uploadStudentPhoto } from '../../middleware/upload.middleware.js';

const router = express.Router();

// Only Admins or Schools can create/update/delete students
router.use(authMiddleware);

router.post('/', roleMiddleware('superadmin', 'school_admin'), studentController.create);
router.patch('/:id', roleMiddleware('superadmin', 'school_admin'), studentController.update);
router.delete('/:id', roleMiddleware('superadmin', 'school_admin'), studentController.remove);
router.get('/:id', roleMiddleware('superadmin', 'school_admin', 'parent'), studentController.getOne);
router.get('/', roleMiddleware('superadmin', 'school_admin', 'parent'), studentController.getAll);
router.post('/:id/assign-bus', roleMiddleware('superadmin', 'school_admin'), studentController.assignBusToStudent);
router.post('/:id/upload-photo', roleMiddleware('superadmin', 'school_admin'), uploadStudentPhoto.single('photo'), studentController.uploadPhoto);

export default router;
