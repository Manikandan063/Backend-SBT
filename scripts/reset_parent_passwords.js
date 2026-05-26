import sequelize from '../src/config/db.js';
import Parent from '../src/modules/parent/parent.model.js';
import { hashPassword } from '../src/shared/auth/bcrypt.js';

async function resetPasswords() {
  try {
    await sequelize.authenticate();
    const parents = await Parent.findAll();
    console.log(`Found ${parents.length} parents. Resetting passwords...`);

    for (const parent of parents) {
      const lastFour = parent.mobileNumber.slice(-4);
      const hashedPassword = await hashPassword(lastFour);
      await parent.update({ password: hashedPassword });
      console.log(`Updated password for ${parent.parentName} (${parent.mobileNumber}) to last 4 digits: ${lastFour}`);
    }

    console.log('✅ All parent passwords have been reset.');
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  } finally {
    await sequelize.close();
  }
}

resetPasswords();
