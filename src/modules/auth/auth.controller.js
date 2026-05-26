import * as authService from './auth.service.js';
import { z } from 'zod';
import { nameValidation, emailValidation, passwordValidation } from '../../shared/utils/validation.util.js';

const loginSchema = z.object({
  email: emailValidation('Email'),
  password: z.string().min(1, 'Password is required'), // Do not strictly validate login password rules, just ensure it's not empty
});

const registerSchema = z.object({
  name: nameValidation('Admin name'),
  email: emailValidation('Email'),
  password: passwordValidation('Password'),
  role: z.enum(['superadmin', 'school_admin']),
  schoolId: z.string().uuid().optional(),
});

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const data = await authService.loginAdmin(email, password);
    res.status(200).json({
      status: 'success',
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const adminData = registerSchema.parse(req.body);
    const admin = await authService.registerAdmin(adminData);
    res.status(201).json({
      status: 'success',
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await authService.getAllAdmins();
    res.status(200).json({
      status: 'success',
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const admin = await authService.updateAdmin(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOwnProfile = async (req, res, next) => {
  try {
    const { name, email, phone, profilePicture } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (req.body.password) updateData.password = req.body.password;

    const updatedAdmin = await authService.updateAdmin(req.user.id, updateData);
    res.status(200).json({
      status: 'success',
      data: updatedAdmin,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    await authService.deleteAdmin(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
