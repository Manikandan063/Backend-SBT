import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
  role: {
    type: DataTypes.ENUM('superadmin', 'school_admin'),
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: true, // Null for superadmin
    field: 'school_id',
  },
  profilePicture: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'admins',
  timestamps: true,
});

export default Admin;
