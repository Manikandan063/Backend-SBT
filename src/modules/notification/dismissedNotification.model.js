import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const DismissedNotification = sequelize.define('DismissedNotification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  notificationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'dismissed_notifications',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['parentId', 'notificationId']
    }
  ]
});

export default DismissedNotification;
