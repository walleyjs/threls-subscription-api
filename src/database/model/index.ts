export * from './Feature';
export * from './Plan';
export * from './PlanFeature';
export * from './User';
export * from './Keystore';
export * from './Subscription';
export * from './Transaction';
export *  from './PaymentMethod';

import mongoose from 'mongoose';
export function verifyModelRegistration() {
  console.log('Registered Mongoose models:', Object.keys(mongoose.models));
}