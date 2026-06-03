import { Parent, Student, School, Bus } from '../../models/initModels.js';
import { hashPassword } from '../../shared/auth/bcrypt.js';
import { AppError } from '../../shared/errorHandling/errorHandler.js';
import { Op } from 'sequelize';
import { sendOnboardingEmail } from '../../shared/utils/mail.service.js';

/**
 * Create Student with Parent details (New Flow)
 * 1. Checks if parent exists by email or mobileNumber
 * 2. Creates parent if not exists
 * 3. Creates student and links to parent
 */
export const createStudentWithParent = async (data) => {
  const { parent: parentData, ...studentData } = data;

  // 1. Validate parent data & Find existing parent by email/mobile
  const parentConditions = [];
  if (parentData.email && parentData.email.trim() !== '') {
    parentConditions.push({ email: parentData.email.trim() });
  }
  if (parentData.mobileNumber && parentData.mobileNumber.trim() !== '') {
    parentConditions.push({ mobileNumber: parentData.mobileNumber.trim() });
  }

  let parent = null;
  if (parentConditions.length > 0) {
    parent = await Parent.findOne({
      where: {
        [Op.or]: parentConditions
      }
    });
  }

  const school = await School.findByPk(studentData.schoolId);
  const schoolName = school ? school.schoolName : 'Our School';

  let whatsappMessage = '';
  let passwordToSend = '';

  // 3. If parent not found, create parent.
  if (!parent) {
    passwordToSend = parentData.mobileNumber.slice(-4);
    const hashedPassword = await hashPassword(passwordToSend);
    parent = await Parent.create({
      ...parentData,
      schoolId: studentData.schoolId, // Link parent to the same school
      password: hashedPassword,
      address: parentData.address || studentData.pickupPoint || 'Not Provided'
    });
    console.log('[STUDENT] Parent found/created');

    whatsappMessage = `
🌟 *Welcome to ${schoolName}* 🌟

Hello *${parent.parentName}*, 
Your account for the School Bus Tracking App has been created successfully.

*Student Registered:* ${studentData.studentName}
*Grade/Section:* ${studentData.class} - ${studentData.section}

*Login Credentials:*
📱 Mobile: ${parent.mobileNumber}
🔑 Password: ${passwordToSend}

*Download App:*
🔗 https://xtown-bus.app/download

Stay safe and track your child's journey in real-time!
`;
  } else {
    // 4. If parent exists and schoolId is null, update schoolId to studentData.schoolId.
    if (!parent.schoolId) {
      parent.schoolId = studentData.schoolId;
      await parent.save();
    }
    console.log('[STUDENT] Parent found/created');
    
    passwordToSend = parent.mobileNumber.slice(-4);
    whatsappMessage = `
🌟 *Update from ${schoolName}* 🌟

Hello *${parent.parentName}*, 
A new student has been successfully linked to your existing School Bus Tracking account.

*New Student:* ${studentData.studentName}
*Grade/Section:* ${studentData.class} - ${studentData.section}

You can track their journey using your existing login credentials.

*Open App:*
🔗 https://xtown-bus.app/dashboard
`;
  }

  // 5. Create student immediately after parent is ready.
  // 6. Link student with parentId: parent.id.
  const student = await Student.create({
    ...studentData,
    rollNo: studentData.rollNo || studentData.rollNumber, 
    gender: studentData.gender || 'Male',
    address: studentData.address || studentData.pickupPoint || 'Not Provided',
    pickupPoint: studentData.pickupPoint || 'Not Provided',
    parentId: parent.id
  });

  console.log('[STUDENT] Student created');

  // 7. Only after successful Student.create, send onboarding email.
  // 8. Wrap email sending in try/catch so email failure does not stop API success.
  try {
    console.log('[EMAIL] Sending onboarding email');
    sendOnboardingEmail(parent, studentData, schoolName, passwordToSend)
      .then(emailSuccess => {
        if (emailSuccess) {
          console.log('[EMAIL] Email sent');
        } else {
          console.log('[EMAIL] Email failed');
        }
      })
      .catch(error => {
        console.log('[EMAIL] Email failed:', error.message);
      });
  } catch (error) {
    console.log('[EMAIL] Email failed:', error.message);
  }

  const encodedMsg = encodeURIComponent(whatsappMessage.trim());
  const whatsappUrl = `https://wa.me/${parent.mobileNumber}?text=${encodedMsg}`;

  return {
    student,
    parent: {
      id: parent.id,
      parentName: parent.parentName,
      email: parent.email,
      mobileNumber: parent.mobileNumber,
      whatsappUrl 
    }
  };
};

export const updateStudent = async (id, updateData) => {
  const student = await Student.findByPk(id);
  if (!student) {
    throw new AppError('Student not found', 404);
  }
  return await student.update(updateData);
};

export const deleteStudent = async (id) => {
  const student = await Student.findByPk(id);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const parentId = student.parentId;

  // Destroy the student
  await student.destroy();

  // If a parentId exists, check if they have other students
  if (parentId) {
    const otherStudentsCount = await Student.count({ where: { parentId } });
    if (otherStudentsCount === 0) {
      // No other students linked, safe to clean up the parent record
      await Parent.destroy({ where: { id: parentId } });
      console.log(`[CLEANUP] Parent ${parentId} removed as they have no remaining students.`);
    }
  }

  return { message: 'Student and orphaned parent (if any) deleted successfully' };
};



export const getStudents = async (filters = {}) => {
  const { search, ...otherFilters } = filters;
  const where = { ...otherFilters };

  if (search) {
    where[Op.or] = [
      { studentName: { [Op.iLike]: `%${search}%` } },
      { rollNo: { [Op.iLike]: `%${search}%` } }
    ];
  }

  return await Student.findAll({ 
    where,
    include: [
      { model: Parent, as: 'parent', attributes: ['id', 'parentName', 'mobileNumber', 'email'] },
      { model: School, as: 'school', attributes: ['id', 'schoolName'] },
      { model: Bus, as: 'bus', attributes: ['id', 'busNumber', 'busRegisterNumber'] }
    ]
  });
};

export const assignBus = async (studentId, busId) => {
  const student = await Student.findByPk(studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }
  return await student.update({ currentBusId: busId });
};

export const updateStudentPhoto = async (id, photoUrl) => {
  const student = await Student.findByPk(id);
  if (!student) throw new Error('Student not found');
  student.profilePhoto = photoUrl;
  await student.save();
  return student;
};

export const getStudentById = async (id) => {
  return await Student.findByPk(id, {
    include: [
      { model: Parent, as: 'parent', attributes: ['parentName', 'mobileNumber', 'email', 'address'] },
      { model: Bus, as: 'bus', attributes: ['busNumber', 'busRegisterNumber', 'routeName', 'driverName', 'driverMobileNumber'] }
    ]
  });
};
