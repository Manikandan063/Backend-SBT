import { Bus } from './bus.model.js';
import { School } from '../school/school.model.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';

export const createBus = async (busData) => {
  // Check for duplicate registration number
  const existingReg = await Bus.findOne({ where: { busRegisterNumber: busData.busRegisterNumber } });
  if (existingReg) {
    throw new AppError('Bus registration number already exists', 400);
  }

  // Check for duplicate GPS Device ID
  if (busData.gpsDeviceId) {
    const existingGps = await Bus.findOne({ where: { gpsDeviceId: busData.gpsDeviceId } });
    if (existingGps) {
      throw new AppError('GPS Device ID is already assigned to another bus', 400);
    }
  }

  // Check for duplicate Device Identifier (IMEI)
  if (busData.deviceIdentifier) {
    const existingIdentifier = await Bus.findOne({ where: { deviceIdentifier: busData.deviceIdentifier } });
    if (existingIdentifier) {
      throw new AppError('Device Identifier (IMEI) is already assigned to another bus', 400);
    }
  }

  const school = await School.findByPk(busData.schoolId);
  if (!school) {
    throw new AppError('School not found', 404);
  }

  return await Bus.create(busData);
};

export const getAllBuses = async (schoolId = null) => {
  const where = {};
  if (schoolId) {
    where.schoolId = schoolId;
  }

  return await Bus.findAll({
    where,
    include: [
      { model: School, as: "school", attributes: ["id", "schoolName"] },
    ],
    order: [['createdAt', 'DESC']]
  });
};

export const getBusById = async (id) => {
  const bus = await Bus.findByPk(id, {
    include: [
      { model: School, as: "school", attributes: ["id", "schoolName", "address"] },
    ],
  });

  if (!bus) {
    throw new AppError('Bus not found', 404);
  }

  return bus;
};

export const updateBus = async (id, busData) => {
  const bus = await Bus.findByPk(id);
  if (!bus) {
    throw new AppError('Bus not found', 404);
  }

  if (busData.busRegisterNumber && busData.busRegisterNumber !== bus.busRegisterNumber) {
    const existing = await Bus.findOne({ where: { busRegisterNumber: busData.busRegisterNumber } });
    if (existing) {
      throw new AppError('Another bus already uses this registration number', 400);
    }
  }

  if (busData.gpsDeviceId && busData.gpsDeviceId !== bus.gpsDeviceId) {
    const existing = await Bus.findOne({ where: { gpsDeviceId: busData.gpsDeviceId } });
    if (existing) {
      throw new AppError('Another bus already uses this GPS Device ID', 400);
    }
  }

  if (busData.deviceIdentifier && busData.deviceIdentifier !== bus.deviceIdentifier) {
    const existing = await Bus.findOne({ where: { deviceIdentifier: busData.deviceIdentifier } });
    if (existing) {
      throw new AppError('Another bus already uses this Device Identifier (IMEI)', 400);
    }
  }

  return await bus.update(busData);
};

export const deleteBus = async (id) => {
  const bus = await Bus.findByPk(id);
  if (!bus) {
    throw new AppError('Bus not found', 404);
  }
  await bus.destroy();
  return true;
};
