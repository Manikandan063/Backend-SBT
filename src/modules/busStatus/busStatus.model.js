import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

// Latest state per bus
const BusStatus = sequelize.define("BusStatus", {
  busId: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM("moving", "stopped", "offline"),
    allowNull: false,
    defaultValue: "offline",
  },
}, {
  timestamps: true,
  tableName: "bus_status",
});

// History of all GPS updates
const BusLog = sequelize.define("BusLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  busId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  timestamps: true,
  updatedAt: false, // Only createdAt is needed for logs
  tableName: "bus_logs",
});

export { BusStatus, BusLog };
export default BusStatus;
