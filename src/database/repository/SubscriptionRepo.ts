import Subscription, { SubscriptionModel } from '../model/Subscription';

async function findOneSubscription(where: any): Promise<Subscription | null> {
  return SubscriptionModel.findOne(where).lean().exec();
}

async function createSubscription(params: any): Promise<Subscription> {
  return SubscriptionModel.create({ ...params });
}

async function updateSubscription(where: any, set: any): Promise<boolean> {
  await SubscriptionModel.updateMany(where, set, { new: true });

  return true;
}

async function findAllSubscriptions(
  where: any,
): Promise<Subscription[] | null> {
  return SubscriptionModel.find(where).sort({ createdAt: -1 }).lean().exec();
}

export default {
  findOneSubscription,
  createSubscription,
  updateSubscription,
  findAllSubscriptions,
};
