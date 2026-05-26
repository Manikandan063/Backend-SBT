import * as schoolService from './school.service.js';
import { createSchoolSchema, updateSchoolSchema } from './school.schema.js';

export const createSchool = async (req, res, next) => {
  try {
    const schoolData = createSchoolSchema.parse(req.body);
    const school = await schoolService.createSchool(schoolData);

    res.status(201).json({
      status: 'success',
      message: 'School created successfully',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSchools = async (req, res, next) => {
  try {
    const schools = await schoolService.getAllSchools();
    res.status(200).json({
      status: 'success',
      count: schools.length,
      data: schools,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchoolById = async (req, res, next) => {
  try {
    const school = await schoolService.getSchoolById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchool = async (req, res, next) => {
  try {
    const schoolData = updateSchoolSchema.parse(req.body);
    const school = await schoolService.updateSchool(req.params.id, schoolData);

    res.status(200).json({
      status: 'success',
      message: 'School updated successfully',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSchool = async (req, res, next) => {
  try {
    await schoolService.deleteSchool(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'School deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
export const toggleSchoolStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    console.log(`[toggleSchoolStatus] called for id=${req.params.id} with status=${status}`);
    const school = await schoolService.updateSchoolStatus(req.params.id, status);

    res.status(200).json({
      status: 'success',
      message: `School ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      data: school,
    });
  } catch (error) {
    next(error);
  }
};
