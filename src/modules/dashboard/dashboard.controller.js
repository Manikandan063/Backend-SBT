import * as dashboardService from './dashboard.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getParentDashboardData(req.user.id);
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const getSuperAdminStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getSuperAdminStats();
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchoolAdminStats = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    let schoolId = null;

    if (userRole === 'superadmin') {
      schoolId = req.query.schoolId || null;
    } else {
      schoolId = req.user.schoolId;
      if (!schoolId) {
        console.warn(`[Security] User ${req.user.email} (Role: ${userRole}) attempted to access school stats without a schoolId!`);
        return res.status(200).json({
          status: 'success',
          data: {
            totalStudents: 0,
            busFleet: 0,
            activeTrips: 0,
            totalTrips: 0,
            fleetEfficiency: 0
          },
          message: 'No school associated with this account. Access restricted.'
        });
      }
    }

    const data = await dashboardService.getSchoolAdminStats(schoolId);
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const getSuperAdminReport = async (req, res, next) => {
  try {
    const data = await dashboardService.getSuperAdminReportData();
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};
