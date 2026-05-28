// import BusLiveLocation from './tracking.model.js';
// import { Bus } from '../bus/bus.model.js';
// import { AppError } from '../../shared/errorHandling/errorHandler.js';
// import traccarService from './traccar.service.js';

// /**
//  * Update live location based on GPS device data
//  */
// export const updateLiveLocation = async (locationData) => {
//   const { gpsDeviceId, busId, driverMobileNumber, latitude, longitude, speed, status, timestamp } = locationData;

//   let bus;
//   if (gpsDeviceId) {
//     bus = await Bus.findOne({ where: { gpsDeviceId } });
//   } else if (busId) {
//     bus = await Bus.findByPk(busId);
//   } else if (driverMobileNumber) {
//     bus = await Bus.findOne({ where: { driverMobileNumber } });
//     if (!bus && !driverMobileNumber.startsWith('+')) {
//        const { Op } = await import('sequelize');
//        bus = await Bus.findOne({ 
//          where: { 
//            driverMobileNumber: { [Op.like]: `%${driverMobileNumber}` } 
//          } 
//        });
//     }
//   }

//   if (!bus) {
//     throw new AppError(`No bus found for the provided ID, Device, or Mobile Number.`, 404);
//   }

//   const finalGpsDeviceId = gpsDeviceId || bus.gpsDeviceId;

//   // 2. Update or Create live location record
//   // We use upsert to maintain only one live location per busId/gpsDeviceId
//   const [liveLocation] = await BusLiveLocation.upsert({
//     busId: bus.id,
//     gpsDeviceId: finalGpsDeviceId,
//     latitude,
//     longitude,
//     speed,
//     status: status || 'morning_pickup', // Fallback for simulation
//     timestamp: timestamp ? new Date(timestamp) : new Date(),
//   });

//   // Trigger proximity notifications in the background
//   checkAndNotifyParents(bus.id, latitude, longitude).catch(err => 
//     console.error('[Notification] Proximity check failed:', err.message)
//   );

//   return liveLocation;
// };

// /**
//  * Haversine formula to calculate distance between two points in KM
//  */
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth radius in km
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a = 
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// /**
//  * Check distances and send notifications to parents
//  */
// export const checkAndNotifyParents = async (busId, currentLat, currentLng) => {
//   try {
//     const { default: Student } = await import('../student/student.model.js');
//     const { default: Parent } = await import('../parent/parent.model.js');
//     const { sendBusAlert } = await import('../../services/notification.service.js');

//     // Find all students on this bus
//     const students = await Student.findAll({
//       where: { currentBusId: busId },
//       include: [{ model: Parent, as: 'parent' }]
//     });

//     for (const student of students) {
//       if (student.parent && student.parent.fcmToken && student.pickupLat && student.pickupLng) {
//         const distance = calculateDistance(
//           currentLat, 
//           currentLng, 
//           student.pickupLat, 
//           student.pickupLng
//         );

//         // If bus is within 2KM, send notification
//         if (distance <= 2.0) {
//           // In a real production app, we'd check if we already sent this in the last X minutes
//           // For now, we'll trigger it.
//           await sendBusAlert(student.parent, 'BUS_ARRIVING', student.currentBusId);
//         }
//       }
//     }
//   } catch (error) {
//     console.error('[Notification] Error in checkAndNotifyParents:', error.message);
//   }
// };

// /**
//  * Get current live location for a specific bus or driver
//  */
// export const getBusLocation = async (idOrDeviceOrMobile) => {
//   const isMobile = /^(\+?\d{1,3})?\d{10}$/.test(idOrDeviceOrMobile);
//   const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrDeviceOrMobile);
  
//   let bus;
//   if (isUuid) {
//     bus = await Bus.findByPk(idOrDeviceOrMobile);
//   } else if (isMobile) {
//     bus = await Bus.findOne({ where: { driverMobileNumber: idOrDeviceOrMobile } });
//     if (!bus && !idOrDeviceOrMobile.startsWith('+')) {
//        const Op = (await import('sequelize')).Op;
//        bus = await Bus.findOne({ 
//          where: { 
//            driverMobileNumber: { [Op.like]: `%${idOrDeviceOrMobile}` } 
//          } 
//        });
//     }
//   } else {
//     bus = await Bus.findOne({ where: { gpsDeviceId: idOrDeviceOrMobile } });
//   }

//   if (!bus) throw new AppError('No bus found for the provided identifier (ID, Device, or Mobile)', 404);

//   let trackingData = null;

//   // 1. Try to fetch from Traccar if provider is TRACCAR
//   if (bus.gpsProvider === 'TRACCAR') {
//     try {
//       // Use gpsDeviceId (internal Traccar ID) or deviceIdentifier (Unique IMEI)
//       let traccarPosition = null;
      
//       let traccarDevice = null;
      
//       // 1. Resolve Device & Position
//       if (bus.gpsDeviceId) {
//         traccarPosition = await traccarService.getDevicePosition(bus.gpsDeviceId).catch(() => null);
        
//         // Fetch device status using either internal ID or unique ID
//         const isNumeric = typeof bus.gpsDeviceId === 'number' || /^\d+$/.test(String(bus.gpsDeviceId));
//         const deviceRes = await traccarService.traccarApi.get('/api/devices', { 
//           params: isNumeric ? { id: bus.gpsDeviceId } : { uniqueId: bus.gpsDeviceId } 
//         }).catch(() => ({ data: [] }));
        
//         if (deviceRes.data?.length > 0) traccarDevice = deviceRes.data[0];
//       }
      
//       // 2. Fallback to Unique ID (IMEI) if internal ID lookup failed
//       if ((!traccarPosition || !traccarDevice) && bus.deviceIdentifier) {
//         const device = await traccarService.findDeviceByUniqueId(bus.deviceIdentifier);
//         if (device) {
//           traccarDevice = device;
//           traccarPosition = await traccarService.getDevicePosition(device.id).catch(() => null);
//         }
//       }

//       if (traccarPosition) {
//         const lastUpdateTime = traccarPosition.serverTime || traccarPosition.fixTime || traccarPosition.deviceTime;
//         const fixTime = new Date(lastUpdateTime);
//         const currentTime = new Date();
//         const diffInSeconds = Math.floor(Math.abs((currentTime - fixTime) / 1000));

//         // High-Tolerance Status Logic:
//         // - LIVE if Traccar reports 'online'
//         // - LIVE if the last update was within 300 seconds (5 minutes)
//         // - OFFLINE if device is strictly 'offline' AND older than 5 minutes
//         let dynamicStatus = "OFFLINE";
//         if (traccarDevice?.status === 'online' || diffInSeconds <= 300) {
//           dynamicStatus = "LIVE";
//         }

//         console.log(`[Tracking] Bus: ${bus.busNumber}, Traccar: ${traccarDevice?.status || 'unknown'}, Diff: ${diffInSeconds}s -> Final: ${dynamicStatus}`);

//         trackingData = {
//           busId: bus.id,
//           busNumber: bus.busNumber,
//           busRegisterNumber: bus.busRegisterNumber,
//           latitude: traccarPosition.latitude,
//           longitude: traccarPosition.longitude,
//           speed: dynamicStatus === "OFFLINE" ? 0 : (traccarPosition.speed || 0),
//           trackingStatus: dynamicStatus,
//           lastUpdated: fixTime,
//           status: 'live',
//           deviceId: traccarDevice?.id || bus.gpsDeviceId,
//           schoolId: bus.schoolId
//         };
//       }
//     } catch (error) {
//       console.error('Traccar fetching failed:', error.message);
//       // We will fallback to local storage if Traccar fails
//     }
//   }

//   // 2. Fallback to local database if Traccar data is missing
//   if (!trackingData) {
//     const localLocation = await BusLiveLocation.findOne({ where: { busId: bus.id } });
//     if (localLocation) {
//       const lastUpdateTime = new Date(localLocation.timestamp);
//       const diffInSeconds = Math.floor(Math.abs((new Date() - lastUpdateTime) / 1000));
      
//       trackingData = {
//         busId: bus.id,
//         busNumber: bus.busNumber,
//         busRegisterNumber: bus.busRegisterNumber,
//         latitude: localLocation.latitude,
//         longitude: localLocation.longitude,
//         speed: diffInSeconds > 600 ? 0 : localLocation.speed,
//         trackingStatus: diffInSeconds <= 300 ? 'LIVE' : 'OFFLINE', // 5 min threshold for LIVE
//         lastUpdated: localLocation.timestamp,
//         status: 'live',
//         gpsProvider: bus.gpsProvider || 'INTERNAL',
//         schoolId: bus.schoolId
//       };
//     }
//   }

//   if (!trackingData) {
//     console.warn(`[Tracking] Real-time data missing for ${idOrDeviceOrMobile}`);
//     // Return an offline-structured object instead of throwing 404 to avoid frontend errors
//     return {
//       busId: bus.id,
//       busNumber: bus.busNumber,
//       busRegisterNumber: bus.busRegisterNumber,
//       latitude: null,
//       longitude: null,
//       speed: 0,
//       trackingStatus: 'OFFLINE',
//       lastUpdated: null,
//       status: 'offline',
//       gpsProvider: bus.gpsProvider || 'INTERNAL',
//       schoolId: bus.schoolId
//     };
//   }

//   return trackingData;
// };

// /**
//  * Get current live locations for ALL buses (for Admin Dashboard)
//  */
// export const getAllFleetLocations = async (schoolId = null) => {
//   const where = schoolId ? { schoolId } : {};
  
//   const buses = await Bus.findAll({
//     where,
//     include: [{
//       model: BusLiveLocation,
//       as: 'liveLocation'
//     }]
//   });

//   // 1. Fetch both devices and positions in bulk to correctly map uniqueIds
//   let traccarPositions = [];
//   let traccarDevices = [];
//   try {
//     const [posRes, devRes] = await Promise.all([
//       traccarService.traccarApi.get('/api/positions').catch(() => ({ data: [] })),
//       traccarService.traccarApi.get('/api/devices').catch(() => ({ data: [] }))
//     ]);
//     traccarPositions = posRes.data || [];
//     traccarDevices = devRes.data || [];
//   } catch (error) {
//     console.error('[Tracking] Failed to fetch bulk telemetry from Traccar:', error.message);
//   }

//   return buses.map(bus => {
//     let loc = bus.liveLocation;
//     let currentLat = loc?.latitude || null;
//     let currentLng = loc?.longitude || null;
//     let currentSpeed = loc?.speed || 0;
//     let lastUpdate = loc ? new Date(loc.timestamp) : null;
    
//     // 2. Resolve Traccar status
//     if (bus.gpsProvider === 'TRACCAR') {
//       // Find device by uniqueId first (gpsDeviceId or deviceIdentifier might store the uniqueId)
//       const device = traccarDevices.find(d => 
//         String(d.uniqueId) === String(bus.gpsDeviceId) || 
//         String(d.uniqueId) === String(bus.deviceIdentifier) ||
//         String(d.id) === String(bus.gpsDeviceId)
//       );

//       if (device) {
//         const traccarPos = traccarPositions.find(p => String(p.deviceId) === String(device.id));
//         if (traccarPos) {
//           currentLat = traccarPos.latitude;
//           currentLng = traccarPos.longitude;
//           currentSpeed = traccarPos.speed || 0;
//           lastUpdate = new Date(traccarPos.serverTime || traccarPos.fixTime || traccarPos.deviceTime);
//         }
//       }
//     }

//     const diffInSeconds = lastUpdate ? Math.floor(Math.abs((new Date() - lastUpdate) / 1000)) : null;
    
//     // Check Traccar specific device status if available
//     let deviceStatus = 'offline';
//     if (bus.gpsProvider === 'TRACCAR') {
//       const device = traccarDevices.find(d => 
//         String(d.uniqueId) === String(bus.gpsDeviceId) || 
//         String(d.uniqueId) === String(bus.deviceIdentifier) ||
//         String(d.id) === String(bus.gpsDeviceId)
//       );
//       if (device) deviceStatus = device.status;
//     }

//     // Use a strict 5-minute window (300 seconds) for "LIVE" in the fleet summary, or explicitly online from Traccar
//     const isLive = deviceStatus === 'online' || (diffInSeconds !== null && diffInSeconds <= 300); 

//     return {
//       id: bus.id,
//       busNumber: bus.busNumber,
//       busRegisterNumber: bus.busRegisterNumber,
//       driverName: bus.driverName,
//       driverMobileNumber: bus.driverMobileNumber,
//       status: bus.status,
//       latitude: currentLat,
//       longitude: currentLng,
//       speed: isLive ? currentSpeed : 0,
//       trackingStatus: isLive ? 'LIVE' : 'OFFLINE',
//       lastUpdated: lastUpdate,
//       gpsProvider: bus.gpsProvider,
//       routeName: bus.routeName,
//       gpsDeviceId: bus.gpsDeviceId,
//       deviceIdentifier: bus.deviceIdentifier,
//       capacity: bus.capacity,
//       schoolId: bus.schoolId
//     };
//   });
// };


import BusLiveLocation from './tracking.model.js';
import { Bus } from '../bus/bus.model.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';
import traccarService from './traccar.service.js';

export const updateLiveLocation = async (locationData) => {
  const {
    gpsDeviceId,
    busId,
    driverMobileNumber,
    latitude,
    longitude,
    speed,
    status,
    timestamp,
  } = locationData;

  let bus;

  if (gpsDeviceId) {
    bus = await Bus.findOne({ where: { gpsDeviceId } });
  } else if (busId) {
    bus = await Bus.findByPk(busId);
  } else if (driverMobileNumber) {
    bus = await Bus.findOne({ where: { driverMobileNumber } });

    if (!bus && !driverMobileNumber.startsWith('+')) {
      const { Op } = await import('sequelize');
      bus = await Bus.findOne({
        where: {
          driverMobileNumber: { [Op.like]: `%${driverMobileNumber}` },
        },
      });
    }
  }

  if (!bus) {
    throw new AppError('No bus found for the provided identifier.', 404);
  }

  const [liveLocation] = await BusLiveLocation.upsert({
    busId: bus.id,
    gpsDeviceId: gpsDeviceId || bus.gpsDeviceId,
    latitude,
    longitude,
    speed: speed || 0,
    status: status || 'morning_pickup',
    timestamp: timestamp ? new Date(timestamp) : new Date(),
  });

  checkAndNotifyParents(bus.id, latitude, longitude).catch((err) =>
    console.error('[Notification] Proximity check failed:', err.message)
  );

  return liveLocation;
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const checkAndNotifyParents = async (busId, currentLat, currentLng) => {
  try {
    if (!currentLat || !currentLng) return;

    const { default: Student } = await import('../student/student.model.js');
    const { default: Parent } = await import('../parent/parent.model.js');
    const { sendBusAlert } = await import('../../services/notification.service.js');

    const students = await Student.findAll({
      where: { currentBusId: busId },
      include: [{ model: Parent, as: 'parent' }],
    });

    for (const student of students) {
      if (student.parent?.fcmToken && student.pickupLat && student.pickupLng) {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          student.pickupLat,
          student.pickupLng
        );

        if (distance <= 2.0) {
          await sendBusAlert(student.parent, 'BUS_ARRIVING', student.currentBusId);
        }
      }
    }
  } catch (error) {
    console.error('[Notification] Error:', error.message);
  }
};

const findBus = async (idOrDeviceOrMobile) => {
  const isMobile = /^(\+?\d{1,3})?\d{10}$/.test(idOrDeviceOrMobile);
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrDeviceOrMobile
    );

  if (isUuid) {
    return Bus.findByPk(idOrDeviceOrMobile);
  }

  if (isMobile) {
    let bus = await Bus.findOne({
      where: { driverMobileNumber: idOrDeviceOrMobile },
    });

    if (!bus && !idOrDeviceOrMobile.startsWith('+')) {
      const { Op } = await import('sequelize');
      bus = await Bus.findOne({
        where: {
          driverMobileNumber: { [Op.like]: `%${idOrDeviceOrMobile}` },
        },
      });
    }

    return bus;
  }

  return Bus.findOne({
    where: { gpsDeviceId: idOrDeviceOrMobile },
  });
};

const getTraccarDataForBus = async (bus) => {
  let traccarDevice = null;
  let traccarPosition = null;

  if (bus.deviceIdentifier) {
    traccarDevice = await traccarService
      .findDeviceByUniqueId(bus.deviceIdentifier)
      .catch(() => null);
  }

  if (!traccarDevice && bus.gpsDeviceId) {
    traccarDevice = await traccarService
      .findDeviceByUniqueId(bus.gpsDeviceId)
      .catch(() => null);
  }

  if (traccarDevice?.id) {
    traccarPosition = await traccarService
      .getDevicePosition(traccarDevice.id)
      .catch(() => null);
  }

  return { traccarDevice, traccarPosition };
};

export const getBusLocation = async (idOrDeviceOrMobile) => {
  const bus = await findBus(idOrDeviceOrMobile);

  if (!bus) {
    throw new AppError('No bus found for the provided identifier.', 404);
  }

  let trackingData = null;

  if (bus.gpsProvider === 'TRACCAR') {
    try {
      const { traccarDevice, traccarPosition } = await getTraccarDataForBus(bus);

      if (traccarPosition) {
        const lastUpdateTime =
          traccarPosition.serverTime ||
          traccarPosition.fixTime ||
          traccarPosition.deviceTime;

        const fixTime = new Date(lastUpdateTime);
        const diffInSeconds = Math.floor((new Date() - fixTime) / 1000);

        const isLive =
          traccarDevice?.status === 'online' ||
          (diffInSeconds >= 0 && diffInSeconds <= 300);

        trackingData = {
          busId: bus.id,
          busNumber: bus.busNumber,
          busRegisterNumber: bus.busRegisterNumber,
          latitude: traccarPosition.latitude,
          longitude: traccarPosition.longitude,
          speed: isLive ? traccarPosition.speed || 0 : 0,
          trackingStatus: isLive ? 'LIVE' : 'OFFLINE',
          lastUpdated: fixTime,
          status: isLive ? 'live' : 'offline',
          gpsProvider: bus.gpsProvider,
          gpsDeviceId: bus.gpsDeviceId,
          deviceIdentifier: bus.deviceIdentifier,
          deviceId: traccarDevice?.id || null,
          schoolId: bus.schoolId,
        };
      }
    } catch (error) {
      console.error('[Tracking] Traccar fetching failed:', error.message);
    }
  }

  if (!trackingData) {
    const localLocation = await BusLiveLocation.findOne({
      where: { busId: bus.id },
    });

    if (localLocation) {
      const lastUpdateTime = new Date(localLocation.timestamp);
      const diffInSeconds = Math.floor((new Date() - lastUpdateTime) / 1000);
      const isLive = diffInSeconds >= 0 && diffInSeconds <= 300;

      trackingData = {
        busId: bus.id,
        busNumber: bus.busNumber,
        busRegisterNumber: bus.busRegisterNumber,
        latitude: localLocation.latitude,
        longitude: localLocation.longitude,
        speed: isLive ? localLocation.speed || 0 : 0,
        trackingStatus: isLive ? 'LIVE' : 'OFFLINE',
        lastUpdated: localLocation.timestamp,
        status: isLive ? 'live' : 'offline',
        gpsProvider: bus.gpsProvider || 'INTERNAL',
        gpsDeviceId: bus.gpsDeviceId,
        deviceIdentifier: bus.deviceIdentifier,
        schoolId: bus.schoolId,
      };
    }
  }

  if (!trackingData) {
    return {
      busId: bus.id,
      busNumber: bus.busNumber,
      busRegisterNumber: bus.busRegisterNumber,
      latitude: null,
      longitude: null,
      speed: 0,
      trackingStatus: 'OFFLINE',
      lastUpdated: null,
      status: 'offline',
      gpsProvider: bus.gpsProvider || 'INTERNAL',
      gpsDeviceId: bus.gpsDeviceId,
      deviceIdentifier: bus.deviceIdentifier,
      schoolId: bus.schoolId,
    };
  }

  return trackingData;
};

export const getAllFleetLocations = async (schoolId = null) => {
  const where = schoolId ? { schoolId } : {};

  const buses = await Bus.findAll({
    where,
    include: [
      {
        model: BusLiveLocation,
        as: 'liveLocation',
      },
    ],
  });

  let traccarPositions = [];
  let traccarDevices = [];

  try {
    const [posRes, devRes] = await Promise.all([
      traccarService.traccarApi.get('/api/positions').catch(() => ({ data: [] })),
      traccarService.traccarApi.get('/api/devices').catch(() => ({ data: [] })),
    ]);

    traccarPositions = posRes.data || [];
    traccarDevices = devRes.data || [];
  } catch (error) {
    console.error('[Tracking] Failed to fetch Traccar fleet data:', error.message);
  }

  return buses.map((bus) => {
    let currentLat = bus.liveLocation?.latitude || null;
    let currentLng = bus.liveLocation?.longitude || null;
    let currentSpeed = bus.liveLocation?.speed || 0;
    let lastUpdate = bus.liveLocation?.timestamp
      ? new Date(bus.liveLocation.timestamp)
      : null;

    let deviceStatus = 'offline';

    if (bus.gpsProvider === 'TRACCAR') {
      const device = traccarDevices.find(
        (d) =>
          String(d.uniqueId) === String(bus.deviceIdentifier) ||
          String(d.uniqueId) === String(bus.gpsDeviceId) ||
          String(d.id) === String(bus.gpsDeviceId)
      );

      if (device) {
        deviceStatus = device.status;

        const traccarPos = traccarPositions.find(
          (p) => String(p.deviceId) === String(device.id)
        );

        if (traccarPos) {
          currentLat = traccarPos.latitude;
          currentLng = traccarPos.longitude;
          currentSpeed = traccarPos.speed || 0;
          lastUpdate = new Date(
            traccarPos.serverTime || traccarPos.fixTime || traccarPos.deviceTime
          );
        }
      }
    }

    const diffInSeconds = lastUpdate
      ? Math.floor((new Date() - lastUpdate) / 1000)
      : null;

    const isLive =
      deviceStatus === 'online' ||
      (diffInSeconds !== null && diffInSeconds >= 0 && diffInSeconds <= 300);

    return {
      id: bus.id,
      busNumber: bus.busNumber,
      busRegisterNumber: bus.busRegisterNumber,
      driverName: bus.driverName,
      driverMobileNumber: bus.driverMobileNumber,
      status: bus.status,
      latitude: currentLat,
      longitude: currentLng,
      speed: isLive ? currentSpeed : 0,
      trackingStatus: isLive ? 'LIVE' : 'OFFLINE',
      lastUpdated: lastUpdate,
      gpsProvider: bus.gpsProvider,
      routeName: bus.routeName,
      gpsDeviceId: bus.gpsDeviceId,
      deviceIdentifier: bus.deviceIdentifier,
      capacity: bus.capacity,
      schoolId: bus.schoolId,
    };
  });
};