import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const ParentSession = sequelize.define('ParentSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'parent_id',
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'device_id',
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'device_name',
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'user_agent',
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  loginTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'login_time',
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'logout_time',
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_active_at',
  }
}, {
  tableName: 'parent_sessions',
  timestamps: true,
});

export default ParentSession;
