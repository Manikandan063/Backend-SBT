import * as busService from './bus.service.js';
import { createBusSchema, updateBusSchema } from './bus.schema.js';

export const createBus = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // Default-Deny: Only superadmins can assign buses to arbitrary schools.
    if (userRole !== 'superadmin') {
      if (!req.user.schoolId) {
        return res.status(403).json({
          status: 'fail',
          message: 'Permission Denied: Your account is not associated with a school.'
        });
      }
      req.body.schoolId = req.user.schoolId;
    }

    const busData = createBusSchema.parse(req.body);
    const bus = await busService.createBus(busData);

    res.status(201).json({
      status: 'success',
      message: 'Bus created successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBuses = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    let schoolId = null;

    if (userRole === 'superadmin') {
      schoolId = req.query.schoolId || null;
    } else {
      // Force schoolId for school_admin and others
      schoolId = req.user.schoolId;
      if (!schoolId) {
        console.warn(`[Security] User ${req.user.email} (Role: ${userRole}) attempted to access bus list without a schoolId!`);
        return res.status(200).json({
          status: 'success',
          count: 0,
          data: [],
          message: 'No school associated with this account. Access restricted.'
        });
      }
    }

    const buses = await busService.getAllBuses(schoolId);
    res.status(200).json({
      status: 'success',
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    next(error);
  }
};

export const getBusById = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    const bus = await busService.getBusById(req.params.id, req.user?.role);
    
    // Ownership check for school_admin
    if (userRole === 'school_admin' && bus.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: This bus belongs to another institution.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBus = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Fetch bus to check ownership
    const busCheck = await busService.getBusById(req.params.id);
    if (userRole === 'school_admin' && busCheck.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You cannot modify a bus from another school.'
      });
    }

    const busData = updateBusSchema.parse(req.body);
    const bus = await busService.updateBus(req.params.id, busData);

    res.status(200).json({
      status: 'success',
      message: 'Bus updated successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBus = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Fetch bus to check ownership
    const busCheck = await busService.getBusById(req.params.id);
    if (userRole === 'school_admin' && busCheck.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You cannot delete a bus from another school.'
      });
    }

    await busService.deleteBus(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
