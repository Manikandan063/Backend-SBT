import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const BusTransferLog = sequelize.define('BusTransferLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  oldBusId: {
    type: DataTypes.UUID,
    allowNull: true, // Null for first assignment
  },
  newBusId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  transferredBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'bus_transfer_logs',
  timestamps: true,
  updatedAt: false, // We only need createdAt for logs
});

export default BusTransferLog;
