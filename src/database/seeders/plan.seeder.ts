// src/database/seeders/plan.seeder.ts
import Logger from '../../core/Logger';
import { PlanModel } from '../model/Plan';
import { FeatureModel } from '../model/Feature';
import { PlanFeatureModel } from '../model/PlanFeature';
import mongoose from 'mongoose';

const plans = [
  {
    name: "Standard Plan",
    description: "For growing businesses",
    price: 29.99,
    currency: "USD",
    billingCycle: "monthly",
    isActive: true,
    trialPeriodDays: 14,
    displayOrder: 1
  },
  {
    name: "Pro Plan",
    description: "For bigger businesses",
    price: 49.99,
    currency: "USD",
    billingCycle: "monthly",
    isActive: true,
    trialPeriodDays: 7,
    displayOrder: 2
  },
  {
    name: "Enterprise Plan",
    description: "For large teams & businesses",
    price: 99.99,
    currency: "USD",
    billingCycle: "monthly",
    isActive: true,
    trialPeriodDays: 0,
    displayOrder: 3
  },
  {
    name: "Standard Annual Plan",
    description: "For growing businesses",
    price: 299.99,
    currency: "USD",
    billingCycle: "yearly",
    isActive: true,
    trialPeriodDays: 14,
    displayOrder: 4
  },
  {
    name: "Pro Annual Plan",
    description: "For bigger businesses",
    price: 499.99,
    currency: "USD",
    billingCycle: "yearly",
    isActive: true,
    trialPeriodDays: 7,
    displayOrder: 5
  }
];

const planFeatureMappings = {
  "Standard Plan": [
    { featureKey: "email_support", isEnabled: true },
    { featureKey: "api_access", isEnabled: true },
    { featureKey: "api_rate_limit", isEnabled: true, value: 1000 },
    { featureKey: "basic_analytics", isEnabled: true }
  ],
  "Pro Plan": [
    { featureKey: "email_support", isEnabled: true },
    { featureKey: "api_access", isEnabled: true },
    { featureKey: "api_rate_limit", isEnabled: true, value: 5000 },
    { featureKey: "priority_support", isEnabled: true },
    { featureKey: "custom_integrations", isEnabled: true }
  ],
  "Enterprise Plan": [
    { featureKey: "email_support", isEnabled: true },
    { featureKey: "api_access", isEnabled: true },
    { featureKey: "api_rate_limit", isEnabled: true, value: "unlimited" },
    { featureKey: "priority_support", isEnabled: true },
    { featureKey: "custom_integrations", isEnabled: true },
    { featureKey: "account_manager", isEnabled: true },
    { featureKey: "sla_guarantee", isEnabled: true }
  ],
  "Standard Annual Plan": [
    { featureKey: "email_support", isEnabled: true },
    { featureKey: "api_access", isEnabled: true },
    { featureKey: "api_rate_limit", isEnabled: true, value: 1000 },
    { featureKey: "basic_analytics", isEnabled: true }
  ],
  "Pro Annual Plan": [
    { featureKey: "email_support", isEnabled: true },
    { featureKey: "api_access", isEnabled: true },
    { featureKey: "api_rate_limit", isEnabled: true, value: 5000 },
    { featureKey: "priority_support", isEnabled: true },
    { featureKey: "custom_integrations", isEnabled: true }
  ]
};

export async function seedPlans() {
  try {
    Logger.info('Seeding subscription plans...');
    

    const features = await FeatureModel.find({});
    const featuresByKey = features.reduce((map, feature) => {
      map[feature.key] = feature._id;
      return map;
    }, {} as Record<string, mongoose.Types.ObjectId>);
    

    const planIds: Record<string, mongoose.Types.ObjectId> = {};
    
    for (const plan of plans) {
      const result = await  PlanModel.findOneAndUpdate(
        { name: plan.name, billingCycle: plan.billingCycle },
        { $set: plan },
        { upsert: true, new: true }
      );
      
      planIds[plan.name] = result._id;
      Logger.debug(`Plan "${plan.name}" ${result.isNew ? 'created' : 'updated'}`);
    }
    

    let featureCount = 0;
    
    for (const [planName, features] of Object.entries(planFeatureMappings)) {
      const planId = planIds[planName];
      
      if (!planId) {
        Logger.warn(`Plan "${planName}" not found, skipping features`);
        continue;
      }
      

      await PlanFeatureModel.deleteMany({ planId });
      
      for (const feature of features) {
        const featureId = featuresByKey[feature.featureKey];
        
        if (!featureId) {
          Logger.warn(`Feature with key "${feature.featureKey}" not found, skipping`);
          continue;
        }
        
        await PlanFeatureModel.create({
          planId,
          featureId,
          isEnabled: feature.isEnabled,
          value: feature.value,
        
        });
        
        featureCount++;
      }
    }
    
    Logger.info(`Subscription plans seeded successfully with ${featureCount} features assigned`);
  } catch (error) {
    Logger.error(`Error seeding plans: ${error}`);
    throw error;
  }
}

if (require.main === module) {
  require('../index');
  
  seedPlans()
    .then(() => {
      Logger.info('Plan seeding completed');
      setTimeout(() => process.exit(0), 1000); 
    })
    .catch(error => {
      Logger.error(`Plan seeding failed: ${error}`);
      process.exit(1);
    });
}