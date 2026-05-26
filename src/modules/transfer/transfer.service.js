import BusTransferLog from './transfer.model.js';
import Student from '../student/student.model.js';
import BusLiveLocation from '../tracking/tracking.model.js';
import { Bus } from '../bus/bus.model.js';
import Notification from '../notification/notification.model.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';
import sequelize from '../../config/db.js';

export const getAllTransfers = async (schoolId = null) => {
  const studentWhere = schoolId ? { schoolId } : {};
  
  return await BusTransferLog.findAll({
    include: [
      { 
        model: Student, 
        as: 'student', 
        attributes: ['id', 'studentName', 'rollNo', 'schoolId'],
        where: schoolId ? studentWhere : undefined,
        required: schoolId ? true : false
      },
      { model: Bus, as: 'oldBus', attributes: ['id', 'busNumber', 'busRegisterNumber'] },
      { model: Bus, as: 'newBus', attributes: ['id', 'busNumber', 'busRegisterNumber'] }
    ],
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Transfer a single student to a new bus permanently
 */
export const transferStudent = async (data) => {
  const { studentId, newBusId, reason, updatedBy } = data;

  const student = await Student.findByPk(studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const oldBusId = student.currentBusId;

  // Transaction for atomicity
  const result = await sequelize.transaction(async (t) => {
    // 1. Update Student
    await student.update({ currentBusId: newBusId }, { transaction: t });

    // 2. Create Transfer Log
    const log = await BusTransferLog.create({
      studentId,
      oldBusId,
      newBusId,
      reason,
      transferredBy: updatedBy || '00000000-0000-0000-0000-000000000000', // Default if not provided
    }, { transaction: t });

    // 3. Get Bus Details
    const newBus = await Bus.findByPk(newBusId, { transaction: t });
    const busNum = newBus ? newBus.busNumber : 'N/A';

    // 4. Create Notification in DB
    await Notification.create({
      title: 'Bus Route Reassignment',
      body: `Student ${student.studentName} has been transferred to Bus ${busNum} (${reason})`,
      type: 'delay',
      targetType: 'bus',
      targetId: newBusId,
      schoolId: student.schoolId,
      sentBy: updatedBy || '00000000-0000-0000-0000-000000000000',
      status: 'sent'
    }, { transaction: t });

    return { student, log };
  });

  return result;
};

/**
 * Emergency transfer: Move all students from one bus to another (breakdown scenario)
 */
export const emergencyTransfer = async (data) => {
  const { oldBusId, newBusId, reason } = data;

  // 1. Find all students on the old bus
  const students = await Student.findAll({ where: { currentBusId: oldBusId } });
  
  if (students.length === 0) {
    // Still update the bus status even if no students are assigned
    await BusLiveLocation.update({ status: 'breakdown' }, { where: { busId: oldBusId } });
    return { message: 'Bus status updated to breakdown. No students were assigned to this bus.' };
  }

  const result = await sequelize.transaction(async (t) => {
    // 2. Update all students to new bus
    await Student.update(
      { currentBusId: newBusId },
      { where: { currentBusId: oldBusId }, transaction: t }
    );

    // 3. Update old bus status to breakdown
    await BusLiveLocation.update(
      { status: 'breakdown' },
      { where: { busId: oldBusId }, transaction: t }
    );

    // 4. Create transfer logs for each student
    const logs = students.map(student => ({
      studentId: student.id,
      oldBusId,
      newBusId,
      reason: `EMERGENCY: ${reason}`,
      transferredBy: '00000000-0000-0000-0000-000000000000', // System/Admin
    }));

    await BusTransferLog.bulkCreate(logs, { transaction: t });

    // 5. Get Bus details for notification body
    const oldBus = await Bus.findByPk(oldBusId, { transaction: t });
    const newBus = await Bus.findByPk(newBusId, { transaction: t });
    const oldBusNum = oldBus ? oldBus.busNumber : 'N/A';
    const newBusNum = newBus ? newBus.busNumber : 'N/A';

    // 6. Create notifications for both old and new buses so parents get notified instantly
    const schoolId = students[0].schoolId;
    await Notification.create({
      title: 'Emergency Fleet Redirection',
      body: `All students from Bus ${oldBusNum} have been transferred to Bus ${newBusNum} due to: ${reason}.`,
      type: 'urgent',
      targetType: 'bus',
      targetId: newBusId,
      schoolId,
      sentBy: '00000000-0000-0000-0000-000000000000',
      status: 'sent'
    }, { transaction: t });

    await Notification.create({
      title: 'Emergency Fleet Redirection',
      body: `All students from Bus ${oldBusNum} have been transferred to Bus ${newBusNum} due to: ${reason}.`,
      type: 'urgent',
      targetType: 'bus',
      targetId: oldBusId,
      schoolId,
      sentBy: '00000000-0000-0000-0000-000000000000',
      status: 'sent'
    }, { transaction: t });

    return { count: students.length };
  });

  return result;
};

export const updateTransferLog = async (id, data) => {
  const { studentId, newBusId, reason } = data;

  const log = await BusTransferLog.findByPk(id);
  if (!log) {
    throw new AppError('Transfer log not found', 404);
  }

  const result = await sequelize.transaction(async (t) => {
    // Sync the student's active bus assignment
    const targetStudentId = studentId || log.studentId;
    let student = null;
    if (newBusId) {
      student = await Student.findByPk(targetStudentId);
      if (student) {
        await student.update({ currentBusId: newBusId }, { transaction: t });
      }
    }

    // Update the log attributes
    await log.update({
      studentId: targetStudentId,
      newBusId: newBusId || log.newBusId,
      reason: reason || log.reason
    }, { transaction: t });

    // Fetch student if not fetched yet
    if (!student) {
      student = await Student.findByPk(targetStudentId, { transaction: t });
    }

    // Get Bus details
    const activeBusId = newBusId || log.newBusId;
    const activeBus = await Bus.findByPk(activeBusId, { transaction: t });
    const busNum = activeBus ? activeBus.busNumber : 'N/A';

    // Create updated notification
    if (student) {
      await Notification.create({
        title: 'Bus Route Reassignment (Updated)',
        body: `Student ${student.studentName} has been transferred to Bus ${busNum} (${reason || log.reason})`,
        type: 'delay',
        targetType: 'bus',
        targetId: activeBusId,
        schoolId: student.schoolId,
        sentBy: '00000000-0000-0000-0000-000000000000',
        status: 'sent'
      }, { transaction: t });
    }

    return log;
  });

  return result;
};
