import * as trackingService from './tracking.service.js';
import { liveLocationSchema } from './tracking.schema.js';

export const updateLiveLocation = async (req, res, next) => {
  try {
    const locationData = liveLocationSchema.parse(req.body);
    const result = await trackingService.updateLiveLocation(locationData);

    res.status(200).json({
      status: 'success',
      message: 'Live location updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBusLocation = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    const location = await trackingService.getBusLocation(busId);
    
    if (!location) {
       return res.status(404).json({ status: 'fail', message: 'Tracking data not found' });
    }

    // Ownership check for all restricted roles (Default-Deny)
    if (userRole !== 'superadmin') {
      if (!req.user.schoolId || location.schoolId !== req.user.schoolId) {
        return res.status(403).json({
          status: 'fail',
          message: 'Permission Denied: You do not have authority to track this bus.'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFleetLocations = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    let schoolId = null;

    if (userRole === 'superadmin') {
      schoolId = req.query.schoolId || null;
    } else {
      schoolId = req.user.schoolId;
      if (!schoolId) {
        console.warn(`[Security] User ${req.user.email} (Role: ${userRole}) attempted to access fleet tracking without a schoolId!`);
        return res.status(200).json({
          status: 'success',
          count: 0,
          data: [],
          message: 'No school associated with this account. Access restricted.'
        });
      }
    }

    let fleetStatus = await trackingService.getAllFleetLocations(schoolId);

    res.status(200).json({
      status: 'success',
      count: fleetStatus.length,
      data: fleetStatus,
    });
  } catch (error) {
    next(error);
  }
};
