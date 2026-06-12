import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('normal', 'delay', 'urgent', 'holiday'),
    defaultValue: 'normal',
  },
  targetType: {
    type: DataTypes.ENUM('all', 'bus', 'group'),
    defaultValue: 'all',
  },
  targetId: {
    type: DataTypes.STRING, // Can be Bus ID or Group ID
    allowNull: true,
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  sentBy: {
    type: DataTypes.UUID, // School Admin ID
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('sent', 'failed', 'scheduled'),
    defaultValue: 'sent',
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

export default Notification;
