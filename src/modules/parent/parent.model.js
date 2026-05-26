import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Parent = sequelize.define('Parent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: true, // Temporarily allow null to avoid sync issues with existing data
  },
  fcmToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'parents',
  timestamps: true,
});

export default Parent;
