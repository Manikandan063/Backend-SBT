import * as transferService from './transfer.service.js';
import { transferStudentSchema, emergencyTransferSchema } from './transfer.schema.js';

export const getTransfers = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    let schoolId = null;

    if (userRole === 'school_admin') {
      schoolId = req.user.schoolId;
      if (!schoolId) {
        return res.status(200).json({
          status: 'success',
          data: []
        });
      }
    } else if (userRole === 'superadmin') {
      schoolId = req.query.schoolId || null;
    }

    const transfers = await transferService.getAllTransfers(schoolId);
    res.status(200).json({
      status: 'success',
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

export const transferStudent = async (req, res, next) => {
  try {
    const validatedData = transferStudentSchema.parse(req.body);
    // If admin is logged in, use their ID
    const updatedBy = req.user?.id || validatedData.updatedBy;
    
    const result = await transferService.transferStudent({ ...validatedData, updatedBy });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const emergencyTransfer = async (req, res, next) => {
  try {
    const validatedData = emergencyTransferSchema.parse(req.body);
    const result = await transferService.emergencyTransfer(validatedData);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await transferService.updateTransferLog(id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Transfer updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
