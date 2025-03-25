import { UserModel } from '../model';
import bcrypt from 'bcrypt';
import Logger from '../../core/Logger';
import dotenv from 'dotenv';


dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
const adminFirstName = process.env.ADMIN_FIRST_NAME || 'System';
const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';

export async function seedAdminUser() {
  try {
    Logger.info('Seeding admin user...');
    

    const existingAdmin = await UserModel.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      Logger.info(`Admin user with email ${adminEmail} already exists`);
      return existingAdmin;
    }
    

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    
    const adminUser = await UserModel.create({
      email: adminEmail,
      password: passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      role:"SUPER_ADMIN",
      isEmailVerified: true
    });
    
    Logger.info(`Admin user created with email: ${adminEmail}`);
    
    return adminUser;
  } catch (error) {
    Logger.error(`Error seeding admin user: ${error}`);
    throw error;
  }
}


if (require.main === module) {
  require('../index');

  seedAdminUser()
   .then(() => {
        Logger.info('Admin seeding completed');
        setTimeout(() => process.exit(0), 1000); 
      })
      .catch(error => {
        Logger.error(`Admin seeding failed: ${error}`);
        process.exit(1);
      });
}