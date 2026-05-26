import * as studentService from './student.service.js';
import { createStudentSchema, updateStudentSchema } from './student.schema.js';
import School from '../school/school.model.js';

export const create = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // Default-Deny: Only superadmins can choose the schoolId.
    // Everyone else is locked to their own school.
    if (userRole !== 'superadmin') {
      if (!req.user.schoolId) {
        return res.status(403).json({
          status: 'fail',
          message: 'Permission Denied: Your account is not associated with a school.'
        });
      }
      req.body.schoolId = req.user.schoolId;
    }

    const validatedData = createStudentSchema.parse(req.body);
    
    // Final check for superadmins who might have forgotten schoolId in body
    if (!validatedData.schoolId) {
      return res.status(400).json({
        status: 'fail',
        message: 'School ID is required.'
      });
    }

    // VERIFY: Check if school exists to avoid FK error
    const schoolExists = await School.findByPk(validatedData.schoolId);
    if (!schoolExists) {
      return res.status(404).json({
        status: 'fail',
        message: `School with ID ${validatedData.schoolId} not found in the system. Please contact superadmin.`
      });
    }

    const result = await studentService.createStudentWithParent(validatedData);
    res.status(201).json({
      status: 'success',
      message: 'Student and Parent processed successfully',
      data: result,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'fail',
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Fetch student first to check ownership
    const studentCheck = await studentService.getStudentById(req.params.id);
    if (!studentCheck) {
      return res.status(404).json({ status: 'fail', message: 'Student not found' });
    }

    // 2. Strict ownership check for school_admin
    if (userRole === 'school_admin' && studentCheck.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You do not have authority over this student.'
      });
    }

    const validatedData = updateStudentSchema.parse(req.body);
    const student = await studentService.updateStudent(req.params.id, validatedData);
    res.status(200).json({
      status: 'success',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // 1. Fetch student first to check ownership
    const studentCheck = await studentService.getStudentById(req.params.id);
    if (!studentCheck) {
      return res.status(404).json({ status: 'fail', message: 'Student not found' });
    }

    // 2. Strict ownership check for school_admin
    if (userRole === 'school_admin' && studentCheck.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You cannot delete a student from another school.'
      });
    }

    await studentService.deleteStudent(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    
    // Default-Deny Policy: All roles except superadmin MUST be filtered by schoolId
    if (userRole === 'superadmin') {
      if (req.query.schoolId) {
        filters.schoolId = req.query.schoolId;
      }
    } else {
      // For school_admin and any other role (like parent), force the schoolId from token
      const restrictedSchoolId = req.user.schoolId;
      
      if (!restrictedSchoolId) {
        console.warn(`[Security] User ${req.user.email} (Role: ${userRole}) attempted to access student list without a schoolId!`);
        return res.status(200).json({
          status: 'success',
          results: 0,
          data: [],
          message: 'No school associated with this account. Access restricted.'
        });
      }
      
      filters.schoolId = restrictedSchoolId;

      // Parents also see only their children within that school
      if (userRole === 'parent') {
        filters.parentId = req.user.id;
      }
    }

    const students = await studentService.getStudents(filters);
    res.status(200).json({
      status: 'success',
      results: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const assignBusToStudent = async (req, res, next) => {
  try {
    const { busId } = req.body;
    const student = await studentService.assignBus(req.params.id, busId);
    res.status(200).json({
      status: 'success',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a photo to upload'
      });
    }

    const photoUrl = `/uploads/students/${req.file.filename}`;
    const student = await studentService.updateStudentPhoto(req.params.id, photoUrl);

    res.status(200).json({
      status: 'success',
      message: 'Profile photo uploaded successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase().replace(/[- ]/g, '_');
    const student = await studentService.getStudentById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        status: 'fail',
        message: 'Student not found'
      });
    }

    // Strict ownership check for school_admin
    if (userRole === 'school_admin' && student.schoolId !== req.user.schoolId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Permission Denied: You do not have authority over this student.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};
