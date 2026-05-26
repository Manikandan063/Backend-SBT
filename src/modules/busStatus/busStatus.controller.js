import * as busStatusService from "./busStatus.service.js";
import { updateBusStatusSchema } from "./busStatus.schema.js";

/**
 * Handle GPS update from bus device
 */
export const updateLocation = async (req, res, next) => {
  try {
    const busData = updateBusStatusSchema.parse(req.body);
    const updatedStatus = await busStatusService.updateBusLocationService(busData);

    return res.status(200).json({
      status: 'success',
      message: "Bus location updated successfully",
      data: updatedStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest status of a bus
 */
export const getStatus = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Fetch status to check ownership (status object usually contains bus info)
    const status = await busStatusService.getBusStatusService(busId);
    
    // 2. Strict ownership check for school_admin
    if (userRole === 'school_admin' && status?.bus?.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You do not have authority over this bus status.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs for a bus
 */
export const getLogs = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Ownership check - Verify bus exists and belongs to school
    const { Bus } = await import('../bus/bus.model.js');
    const bus = await Bus.findByPk(busId);
    
    if (!bus) {
      return res.status(404).json({ status: 'fail', message: 'Bus not found' });
    }

    if (userRole === 'school_admin' && bus.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You cannot view logs for another school\'s bus.'
      });
    }

    const logs = await busStatusService.getBusLogsService(busId);

    return res.status(200).json({
      status: 'success',
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
