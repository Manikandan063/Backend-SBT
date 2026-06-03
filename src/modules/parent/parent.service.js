import Parent from './parent.model.js';
import Student from '../student/student.model.js';
import Bus from '../bus/bus.model.js';
import School from '../school/school.model.js';
import Admin from '../auth/admin.model.js';
import { comparePassword, hashPassword } from '../../shared/auth/bcrypt.js';
import { generateToken } from '../../shared/auth/jwt.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';
import ParentSession from './parentSession.model.js';

/**
 * Parent Login
 */
export const loginParent = async (mobileNumber, password, deviceInfo = {}) => {
  console.log(`[AUTH] Login attempt for mobile: ${mobileNumber}`);
  const parent = await Parent.findOne({ where: { mobileNumber } });

  if (!parent || !(await comparePassword(password, parent.password))) {
    console.warn(`[AUTH] Login failed for mobile: ${mobileNumber}`);
    throw new AppError('Invalid mobile number or password', 401);
  }

  // Check if school is blocked
  if (parent.schoolId) {
    const school = await School.findByPk(parent.schoolId);
    if (school && school.status === 'blocked') {
      throw new AppError('Your access is blocked. Contact XTOWN', 403);
    }
  }

  // Single Device Restriction Logic
  const activeSession = await ParentSession.findOne({
    where: { parentId: parent.id, isActive: true }
  });

  if (activeSession) {
    // If logging in from the exact same device ID, just overwrite it
    if (activeSession.deviceId === deviceInfo.deviceId) {
      await activeSession.update({ isActive: false, logoutTime: new Date() });
    } else if (deviceInfo.force) {
      // Logout other device explicitly
      await activeSession.update({ isActive: false, logoutTime: new Date() });
    } else {
      // Block login - active session exists on another device
      const err = new AppError('You are already logged in on another device. Please logout from that device.', 409);
      err.code = 'ACTIVE_SESSION_EXISTS';
      throw err;
    }
  }

  // Create new active session for this login
  const session = await ParentSession.create({
    parentId: parent.id,
    deviceId: deviceInfo.deviceId || `device_${Date.now()}`,
    deviceName: deviceInfo.deviceName || 'Unknown Device',
    userAgent: deviceInfo.userAgent || 'Unknown',
    ipAddress: deviceInfo.ipAddress || 'Unknown',
    isActive: true,
    loginTime: new Date(),
    lastActiveAt: new Date()
  });

  console.log(`[AUTH] Login successful for Parent: ${parent.parentName} (ID: ${parent.id}, Type: ${typeof parent.id})`);
  import('fs').then(fs => {
    fs.appendFileSync('startup.log', `[${new Date().toISOString()}] [AUTH] Login: ${parent.parentName} (ID: ${parent.id}, Type: ${typeof parent.id})\n`);
  });

  const token = generateToken({ 
    id: parent.id, 
    role: 'parent', 
    mobileNumber: parent.mobileNumber,
    schoolId: parent.schoolId,
    sessionId: session.id
  });

  const { password: _, ...parentData } = parent.toJSON();
  return { parent: parentData, token };
};

/**
 * Parent Logout
 */
export const logoutParent = async (parentId, deviceId) => {
  const whereClause = { parentId, isActive: true };
  if (deviceId) {
    whereClause.deviceId = deviceId;
  }
  
  await ParentSession.update(
    { isActive: false, logoutTime: new Date() },
    { where: whereClause }
  );
  return true;
};

/**
 * Get Parent Dashboard Data (Profile)
 * Fetches parent info along with their children (students) and bus assignments
 */
export const getParentProfile = async (id) => {
  console.log(`[PROFILE] Fetching data for Parent ID: ${id}`);
  
  // DEBUG: Log to file because I can't see console
  import('fs').then(fs => {
    fs.appendFileSync('debug_profile.log', `[${new Date().toISOString()}] Fetching Profile for ID: ${id}\n`);
  });

  let parent = await Parent.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Student,
        as: 'children',
        attributes: [
          'id', 
          'studentName', 
          'class', 
          'section', 
          'gender', 
          'pickupPoint', 
          'pickupLat',
          'pickupLng',
          'profilePhoto',
          'currentBusId'
        ],
        include: [
          { 
            model: Bus, 
            as: 'bus', 
            attributes: ['id', 'busNumber', 'busRegisterNumber', 'driverName', 'driverMobileNumber', 'capacity'] 
          },
          { model: School, as: 'school', attributes: ['id', 'schoolName', 'longitude'] }
        ]
      }
    ]
  });

  if (!parent) {
    console.log(`[PROFILE] Parent not found for ID: ${id}. Checking if ID belongs to an Admin...`);
    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (admin) {
      console.log(`[PROFILE] Admin found: ${admin.name}. Returning formatted admin data.`);
      return {
        id: admin.id,
        parentName: admin.name,
        email: admin.email,
        role: admin.role,
        mobileNumber: 'N/A', // Admin model doesn't have mobileNumber
        children: []
      };
    }

    console.error(`[PROFILE] User not found for ID: ${id}`);
    throw new AppError('User Profile Not Found in Database', 404);
  }

  console.log(`[PROFILE] Data retrieved for: ${parent.parentName}`);
  return parent;
};
/**
 * Update Parent details
 */
export const updateParent = async (id, updateData) => {
  const parent = await Parent.findByPk(id);
  if (!parent) {
    throw new AppError('Parent not found', 404);
  }
  
  // Hash password if it's being updated
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  return await parent.update(updateData);
};

/**
 * Update Parent FCM Token
 */
export const updateFcmToken = async (id, fcmToken) => {
  const parent = await Parent.findByPk(id);
  if (!parent) {
    throw new AppError('Parent not found', 404);
  }
  
  return await parent.update({ fcmToken });
};

/**
 * Get all parents (Admin)
 */
export const getAllParents = async (schoolId = null) => {
  const studentWhere = {};
  
  if (schoolId) {
    studentWhere.schoolId = schoolId;
  }

  const results = await Parent.findAll({
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Student,
        as: 'children',
        attributes: ['id', 'studentName', 'class', 'section', 'rollNo', 'schoolId'],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
        required: schoolId ? true : false
      }
    ]
  });

  return results;
};

/**
 * Delete Parent (Admin)
 */
export const deleteParent = async (id) => {
  const parent = await Parent.findByPk(id);
  if (!parent) {
    throw new AppError('Parent not found', 404);
  }
  
  // Also delete linked students to maintain integrity if manually deleting a parent
  await Student.destroy({ where: { parentId: id } });
  await parent.destroy();
  
  return { message: 'Parent and linked students deleted successfully' };
};

/* ==========================================
   ADDED CODE: Smart School Assistant Popup
   ========================================== */
/**
 * Get Smart School Assistant details for a given child
 */
export const getSmartAssistantData = async (studentId) => {
  const student = await Student.findByPk(studentId, {
    include: [
      {
        model: Bus,
        as: 'bus',
        attributes: ['id', 'busNumber']
      }
    ]
  });

  const greetingName = student ? student.studentName.split(' ')[0] : 'Arun';

  // Build the complete smart update structure using real bus assignments or safe fallbacks
  return {
    greetingName,
    bus: {
      busNumber: student?.bus?.busNumber || 'Bus 02',
      etaMinutes: 2,
      distanceKm: 1.6,
      status: 'On the way to pickup'
    },
    weather: {
      title: 'Light rain expected',
      message: 'Carry an umbrella'
    },
    traffic: {
      status: 'Moderate traffic on your route'
    },
    attendance: {
      status: 'Present',
      message: `${greetingName} marked Present`
    },
    announcement: {
      title: 'PTM on Saturday',
      message: 'Timing: 10 AM – 1 PM'
    }
  };
};
