import sequelize from '../src/config/db.js';
import { initModels, Student, Parent } from '../src/models/initModels.js';

async function fixDuplicates() {
  try {
    await sequelize.authenticate();
    initModels();

    // Find Edwin Raj
    const parent = await Parent.findOne({ where: { mobileNumber: '9597522458' } });
    if (!parent) {
      console.log('Edwin Raj not found.');
      return;
    }

    // Find his children
    const children = await Student.findAll({ where: { parentId: parent.id } });
    console.log(`Edwin Raj has ${children.length} children recorded.`);

    if (children.length > 1) {
      // Check for same name
      const names = children.map(c => c.studentName);
      if (new Set(names).size < names.length) {
        console.log('Duplicate names found. Cleaning up...');
        
        // Keep the first one, delete the rest with the same name and parent
        const seen = new Set();
        for (const child of children) {
          if (seen.has(child.studentName)) {
            console.log(`Deleting duplicate: ${child.studentName} (ID: ${child.id})`);
            await child.destroy();
          } else {
            seen.add(child.studentName);
          }
        }
      }
    }

    console.log('✅ Cleanup complete.');
  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
  } finally {
    await sequelize.close();
  }
}

fixDuplicates();
