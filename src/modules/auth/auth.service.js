import Admin from './admin.model.js';
import { School } from '../school/school.model.js';
import { hashPassword, comparePassword } from '../../shared/auth/bcrypt.js';
import { generateToken } from '../../shared/auth/jwt.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';

export const loginAdmin = async (email, password) => {
  const admin = await Admin.findOne({ 
    where: { email },
    include: [
      {
        model: School,
        as: 'school',
        attributes: ['schoolName', 'status']
      }
    ]
  });
  
  if (!admin || !(await comparePassword(password, admin.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if school is blocked
  if (admin.role !== 'superadmin' && admin.school && admin.school.status === 'blocked') {
    throw new AppError('Your access is blocked. Contact XTOWN', 403);
  }

  const token = generateToken({ 
    id: admin.id, 
    role: admin.role, 
    email: admin.email,
    schoolId: admin.schoolId 
  });

  const { password: _, ...adminData } = admin.toJSON();
  return { admin: adminData, token };
};

export const registerAdmin = async (adminData) => {
  const existingAdmin = await Admin.findOne({ where: { email: adminData.email } });
  if (existingAdmin) {
    throw new AppError('Admin with this email already exists', 400);
  }

  const hashedPassword = await hashPassword(adminData.password);
  const admin = await Admin.create({
    ...adminData,
    password: hashedPassword,
  });

  const { password: _, ...adminResult } = admin.toJSON();
  return adminResult;
};

export const getAllAdmins = async () => {
  return await Admin.findAll({
    attributes: { exclude: ['password'] },
    include: [
      {
        model: School,
        as: 'school',
        attributes: ['schoolName']
      }
    ]
  });
};

export const updateAdmin = async (id, adminData) => {
  const admin = await Admin.findByPk(id);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  if (adminData.password) {
    adminData.password = await hashPassword(adminData.password);
  } else {
    delete adminData.password;
  }

  await admin.update(adminData);

  // Reload the admin to include the School association, matching the login schema
  const reloadedAdmin = await Admin.findByPk(id, {
    include: [
      {
        model: School,
        as: 'school',
        attributes: ['schoolName', 'status']
      }
    ]
  });

  const { password: _, ...adminResult } = reloadedAdmin.toJSON();
  return adminResult;
};

export const deleteAdmin = async (id) => {
  const admin = await Admin.findByPk(id);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  await admin.destroy();
  return true;
};
