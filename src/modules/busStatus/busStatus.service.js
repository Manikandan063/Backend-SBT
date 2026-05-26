import { BusStatus, BusLog } from "./busStatus.model.js";
import { Bus } from "../bus/bus.model.js";
import { AppError } from "../../shared/errorHandling/errorHandler.js";

const determineStatusFromSpeed = (speed) => {
  return speed > 5 ? "moving" : "stopped";
};

const checkIsOffline = (lastUpdateAt, thresholdMinutes = 10) => {
  if (!lastUpdateAt) return true;
  const lastUpdate = new Date(lastUpdateAt);
  const now = new Date();
  const diffInMinutes = (now - lastUpdate) / (1000 * 60);
  return diffInMinutes > thresholdMinutes;
};

/**
 * Update latest bus location and store in logs
 */
export const updateBusLocationService = async (data) => {
  const { busId, latitude, longitude, speed } = data;

  // Optional: Verify bus exists
  const busExists = await Bus.findByPk(busId);
  if (!busExists) {
    throw new AppError("Bus not found", 404);
  }

  // Determine current status based on speed
  const status = determineStatusFromSpeed(speed);

  // 1. Update latest state (upsert)
  // If record exists for busId, update it. Otherwise create.
  const [latestStatus, created] = await BusStatus.upsert({
    busId,
    latitude,
    longitude,
    speed,
    status,
  });

  // 2. Store as history log
  await BusLog.create({
    busId,
    latitude,
    longitude,
    speed,
  });

  return latestStatus;
};

/**
 * Get latest status of a specific bus
 */
export const getBusStatusService = async (busId) => {
  const statusRecord = await BusStatus.findOne({
    where: { busId },
  });

  if (!statusRecord) {
    return null;
  }

  // Check if it's actually offline based on last update time
  const isOffline = checkIsOffline(statusRecord.updatedAt);
  
  const result = statusRecord.toJSON();
  if (isOffline) {
    result.status = "offline";
  }

  return result;
};

/**
 * Get full movement history logs for a specific bus
 */
export const getBusLogsService = async (busId) => {
  const logs = await BusLog.findAll({
    where: { busId },
    order: [["createdAt", "DESC"]],
    limit: 100, // Reasonable limit for history
  });

  return logs;
};
