import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

/**
 * BusLiveLocation stores the latest GPS coordinates from devices
 */
const BusLiveLocation = sequelize.define('BusLiveLocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  busId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // Only one live location record per bus
    field: 'bus_id',
  },
  gpsDeviceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  speed: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  course: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  accuracy: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  trackingSource: {
    type: DataTypes.ENUM('TRACCAR', 'GOOGLE_NAVIGATION', 'AUTO'),
    defaultValue: 'AUTO',
  },
  tripStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'inactive', 
      'morning_pickup', 
      'school_reached', 
      'evening_drop', 
      'trip_completed', 
      'private_use', 
      'maintenance', 
      'breakdown', 
      'holiday'
    ),
    defaultValue: 'inactive',
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'bus_live_locations',
  timestamps: true,
});

export default BusLiveLocation;
