import { hashPassword } from '../shared/auth/bcrypt.js';
import Admin from '../modules/auth/admin.model.js';
import School from '../modules/school/school.model.js';
import Bus from '../modules/bus/bus.model.js';
import BusLiveLocation from '../modules/tracking/tracking.model.js';
import sequelize, { connectDB } from '../config/db.js';
import { initModels } from '../models/initModels.js';

import Parent from '../modules/parent/parent.model.js';
import Student from '../modules/student/student.model.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    initModels();
    
    // CHANGE: Use alter instead of force to prevent data loss
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced safely (alter: true)");

    const hashedPassword = await hashPassword('password123');

    // 1. Create SuperAdmin (Upsert)
    const [admin] = await Admin.findOrCreate({
      where: { email: 'superadmin@example.com' },
      defaults: {
        name: 'Super Admin',
        password: hashedPassword,
        role: 'superadmin',
      }
    });

    // 2. Create School (Upsert)
    const [school] = await School.findOrCreate({
      where: { id: '11111111-1111-1111-1111-111111111111' },
      defaults: {
        schoolName: "Coimbatore Public School",
        address: "Saravanampatti, Coimbatore",
        phone: "0422-1234567",
        email: "info@cpschool.com",
        principalName: "Dr. Rajesh",
        latitude: 11.0760,
        longitude: 76.9930
      }
    });

    // 3. Create Bus (Upsert)
    const [bus] = await Bus.findOrCreate({
      where: { id: '22222222-2222-2222-2222-222222222222' },
      defaults: {
        busRegisterNumber: "TN37XY9999",
        busNumber: "BUS-10",
        capacity: 40,
        routeName: "Peelamedu to School",
        schoolId: school.id,
        driverName: "Murugan",
        driverMobileNumber: "9843212345",
        gpsDeviceId: "GPS_DEVICE_001",
        status: "ACTIVE",
        morningStartTime: "07:30 AM",
        eveningStartTime: "03:45 PM"
      }
    });

    // 4. Create Initial Live Location (Upsert)
    await BusLiveLocation.findOrCreate({
      where: { busId: bus.id },
      defaults: {
        gpsDeviceId: bus.gpsDeviceId,
        latitude: 11.0168,
        longitude: 76.9558,
        speed: 0,
        timestamp: new Date()
      }
    });

    // 5. Create Demo Parent (Upsert)
    const [parent] = await Parent.findOrCreate({
      where: { mobileNumber: "9876543210" },
      defaults: {
        parentName: "Ravisankar",
        email: "parent@example.com",
        password: hashedPassword,
        address: "Peelamedu, Coimbatore",
        schoolId: school.id
      }
    });

    // 6. Create Demo Students (Upsert)
    await Student.findOrCreate({
      where: { rollNo: "TMS-2024-082" },
      defaults: {
        studentName: "Karthi S.",
        class: "4",
        section: "A",
        gender: "Male",
        address: "Peelamedu, Coimbatore",
        pickupPoint: "Main Road Junction",
        schoolId: school.id,
        parentId: parent.id,
        currentBusId: bus.id
      }
    });

    await Student.findOrCreate({
      where: { rollNo: "TMS-2024-115" },
      defaults: {
        studentName: "Ananya S.",
        class: "1",
        section: "B",
        gender: "Female",
        address: "Peelamedu, Coimbatore",
        pickupPoint: "Main Road Junction",
        schoolId: school.id,
        parentId: parent.id
      }
    });

    console.log('✅ Realistic Initial Data verified/created successfully!');
    console.log('Admin: superadmin@example.com / password123');
    console.log('Parent: 9876543210 / password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
