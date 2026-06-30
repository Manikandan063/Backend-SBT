import Parent from '../modules/parent/parent.model.js';
import Student from '../modules/student/student.model.js';
import BusLiveLocation from '../modules/tracking/tracking.model.js';
import BusTransferLog from '../modules/transfer/transfer.model.js';
import Admin from '../modules/auth/admin.model.js';
import Bus from '../modules/bus/bus.model.js';
import School from '../modules/school/school.model.js';
import User from '../modules/user/user.model.js';
import { BusStatus, BusLog } from '../modules/busStatus/busStatus.model.js';
import Notification from '../modules/notification/notification.model.js';
import DismissedNotification from '../modules/notification/dismissedNotification.model.js';
import ParentSession from '../modules/parent/parentSession.model.js';

const initModels = () => {
  // Parent - Student (One to Many)
  Parent.hasMany(Student, { foreignKey: 'parentId', as: 'children', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Student.belongsTo(Parent, { foreignKey: 'parentId', as: 'parent' });

  // Parent - ParentSession (One to Many)
  Parent.hasMany(ParentSession, { foreignKey: 'parentId', as: 'sessions', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  ParentSession.belongsTo(Parent, { foreignKey: 'parentId', as: 'parent' });

  // Student - Bus Transfer Logs (One to Many)
  Student.hasMany(BusTransferLog, { foreignKey: 'studentId', as: 'transferLogs', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  BusTransferLog.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
  BusTransferLog.belongsTo(Bus, { foreignKey: 'oldBusId', as: 'oldBus' });
  BusTransferLog.belongsTo(Bus, { foreignKey: 'newBusId', as: 'newBus' });

  // School - Bus (One to Many)
  School.hasMany(Bus, { foreignKey: 'schoolId', sourceKey: 'id', as: 'buses', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Bus.belongsTo(School, { foreignKey: 'schoolId', targetKey: 'id', as: 'school' });

  // Student - School (Many to One)
  Student.belongsTo(School, { foreignKey: 'schoolId', targetKey: 'id', as: 'school' });
  School.hasMany(Student, { foreignKey: 'schoolId', sourceKey: 'id', as: 'students', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

  // Bus - BusLiveLocation (One to One)
  Bus.hasOne(BusLiveLocation, { foreignKey: 'busId', as: 'liveLocation', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  BusLiveLocation.belongsTo(Bus, { foreignKey: 'busId', as: 'bus' });

  // Student - Bus (Many to One)
  Student.belongsTo(Bus, { foreignKey: 'currentBusId', as: 'bus' });
  Bus.hasMany(Student, { foreignKey: 'currentBusId', as: 'students', onDelete: 'SET NULL', onUpdate: 'CASCADE' });

  // School - Admin (One to Many)
  School.hasMany(Admin, { foreignKey: 'schoolId', sourceKey: 'id', as: 'admins', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Admin.belongsTo(School, { foreignKey: 'schoolId', targetKey: 'id', as: 'school' });

  // Parent - DismissedNotification (One to Many)
  Parent.hasMany(DismissedNotification, { foreignKey: 'parent_Id', as: 'dismissedNotifications', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  DismissedNotification.belongsTo(Parent, { foreignKey: 'parent_Id', as: 'parent' });

  // Notification - DismissedNotification (One to Many)
  Notification.hasMany(DismissedNotification, { foreignKey: 'notificationId', as: 'dismissals', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  DismissedNotification.belongsTo(Notification, { foreignKey: 'notificationId', as: 'notification' });
};

export { Parent, Student, BusLiveLocation, BusTransferLog, Admin, Bus, School, User, BusStatus, BusLog, Notification, DismissedNotification, ParentSession, initModels };

