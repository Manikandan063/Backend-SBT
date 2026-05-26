import express from 'express';
import * as transferController from './transfer.controller.js';
import { authMiddleware } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', transferController.getTransfers);
router.post('/student', transferController.transferStudent);
router.post('/emergency', transferController.emergencyTransfer);
router.put('/:id', transferController.updateTransfer);

export default router;
