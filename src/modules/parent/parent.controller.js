import * as parentService from './parent.service.js';
import { parentLoginSchema } from './parent.schema.js';

export const login = async (req, res, next) => {
  try {
    const { mobileNumber, password, force, deviceId, deviceName } = parentLoginSchema.parse(req.body);
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    const data = await parentService.loginParent(
      mobileNumber, 
      password, 
      { force, deviceId, deviceName, userAgent, ipAddress }
    );

    res.status(200).json({
      status: 'success',
      ...data,
    });
  } catch (error) {
    if (error.statusCode === 409 && error.code === 'ACTIVE_SESSION_EXISTS') {
      return res.status(409).json({
        status: 'fail',
        code: 'ACTIVE_SESSION_EXISTS',
        message: error.message
      });
    }
    console.error('LOGIN_ERROR_DETAILS:', error);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const deviceId = req.body.deviceId || req.headers['x-device-id'];
    await parentService.logoutParent(req.user.id, deviceId);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    // req.user.id comes from authMiddleware
    const parent = await parentService.getParentProfile(req.user.id);
    res.status(200).json({
      status: 'success',
      data: parent,
    });
  } catch (error) {
    next(error);
  }
};
export const updateProfile = async (req, res, next) => {
  try {
    const parent = await parentService.updateParent(req.user.id, req.body);
    res.status(200).json({
      status: 'success',
      data: parent,
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateParent = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Fetch parent first to check ownership
    const parentCheck = await parentService.getParentProfile(req.params.id);
    if (!parentCheck) {
      return res.status(404).json({ status: 'fail', message: 'Parent not found' });
    }

    // 2. Strict ownership check for school_admin
    if (userRole === 'school_admin' && parentCheck.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: This parent belongs to another institution.'
      });
    }

    const parent = await parentService.updateParent(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: parent,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await parentService.updateFcmToken(req.user.id, fcmToken);
    res.status(200).json({
      status: 'success',
      message: 'FCM token updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllParents = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    let schoolId = null;

    if (userRole === 'superadmin') {
      schoolId = req.query.schoolId || null;
    } else {
      schoolId = req.user.schoolId;
      if (!schoolId) {
        console.warn(`[Security] User ${req.user.email} (Role: ${userRole}) attempted to access parent list without a schoolId!`);
        return res.status(200).json({
          status: 'success',
          count: 0,
          data: [],
          message: 'No school associated with this account. Access restricted.'
        });
      }
    }

    const parents = await parentService.getAllParents(schoolId);
    res.status(200).json({
      status: 'success',
      results: parents.length,
      data: parents,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================
   ADDED CODE: Smart School Assistant Popup
   ========================================== */
/**
 * Retrieve Smart Assistant updates for parent's current child
 */
export const getSmartAssistant = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const data = await parentService.getSmartAssistantData(studentId);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
