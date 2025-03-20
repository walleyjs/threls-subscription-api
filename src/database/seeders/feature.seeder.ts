
import { FeatureModel } from "../model/Feature";
import Logger from "../../core/Logger";

const features = [
  {
    name: 'Email Support',
    description: 'Get support via email',
    key: 'email_support',
    category: 'support',
    limitType: "boolean",
    defaultLimitValue: true,
    displayOrder: 10
  },
  {
    name: 'API Access',
    description: 'Access to our API',
    key: 'api_access',
    category: 'api',
    limitType: 'boolean',
    defaultLimitValue: true,
    displayOrder: 20
  },
  {
    name: 'API Rate Limit',
    description: 'Number of API calls per day',
    key: 'api_rate_limit',
    category: 'api',
    limitType: "quantity",
    defaultLimitValue: 1000,
    displayOrder: 30
  },
];

export async function seedFeatures() {
  try {
    Logger.info('Seeding features...');
    
    const operations = features.map(feature => ({
      updateOne: {
        filter: { key: feature.key },
        update: { $set: feature },
        upsert: true
      }
    }));
    
    if (operations.length > 0) {
      const result = await FeatureModel.bulkWrite(operations);
      Logger.info(`Features seeded: ${result.upsertedCount} inserted, ${result.modifiedCount} modified`);
    } else {
      Logger.info('No features to seed');
    }
    
    Logger.info('Features seeded successfully');
  } catch (error) {
    Logger.error(`Error seeding features: ${error}`);
    throw error;
  }
}

if (require.main === module) {
  require('../index');
  
  seedFeatures()
    .then(() => {
      Logger.info('Feature seeding completed');
      setTimeout(() => process.exit(0), 1000); 
    })
    .catch(error => {
      Logger.error(`Feature seeding failed: ${error}`);
      process.exit(1);
    });
}