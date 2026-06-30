import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

export const Bus = sequelize.define("Bus", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  busRegisterNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  busNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  routeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'school_id',
  },
  driverName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driverMobileNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gpsDeviceId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  gpsProvider: {
    type: DataTypes.ENUM("TRACCAR", "SIMULATED", "STANDARD", "ENTERPRISE"),
    defaultValue: "SIMULATED",
  },
  deviceIdentifier: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  trackingStatus: {
    type: DataTypes.ENUM("ACTIVE", "OFFLINE", "INACTIVE", "SCHOOL_HOURS_ONLY"),
    defaultValue: "INACTIVE",
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
    defaultValue: "ACTIVE",
  },
  morningStartTime: {
    type: DataTypes.STRING, // Store as "07:30" or similar
    allowNull: true,
  },
  eveningStartTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'buses',
  timestamps: true,
});

export default Bus;
