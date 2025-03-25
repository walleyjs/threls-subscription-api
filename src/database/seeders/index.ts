import { connection } from '../index'; 
import Logger from '../../core/Logger';
import { seedFeatures } from './feature.seeder';
import { seedPlans } from './plan.seeder';
import { seedAdminUser } from './admin.seeder';


async function runSeeders() {
  try {
    if (connection.readyState !== 1) {
      Logger.info('Waiting for database connection...');
      // Wait for connection to be established
      await new Promise<void>((resolve) => {
        connection.once('connected', () => resolve());
      });
    }

    Logger.info('Starting to seed database...');
    await seedAdminUser()
    await seedFeatures();
    await seedPlans();

    
    Logger.info('Database seeding completed successfully');
  } catch (error) {
    Logger.error(`Error seeding database: ${error}`);
    throw error;
  }
}


if (require.main === module) {
  runSeeders()
    .then(() => {
      Logger.info('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error(`Seeding failed: ${error}`);
      process.exit(1);
    });
}

export default runSeeders;