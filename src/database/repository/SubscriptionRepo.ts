import Subscription, { SubscriptionModel } from '../model/Subscription';

async function findOneSubscription(where: any): Promise<Subscription | null> {
  return SubscriptionModel.findOne(where).populate([{
    path:"planId"
  }]).lean().exec();
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
  return SubscriptionModel.find(where)
    .populate([
      {
        path: 'userId',
      },
      {
        path: 'planId',
      },
    ])
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}



async function getSubscribersByPlan(): Promise<any> {
  return SubscriptionModel.aggregate([
    {
      $match: { status: 'active' }
    },
    {
      $group: {
        _id: '$planId',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'planDetails'
      }
    },
    {
      $unwind: '$planDetails'
    },
    {
      $project: {
        planName: '$planDetails.name',
        count: 1,
        _id: 0
      }
    }
  ]);
  
}

async function getSubscribersCount(where:any): Promise<any> {
  return SubscriptionModel.countDocuments(where);
}

export default {
  findOneSubscription,
  createSubscription,
  updateSubscription,
  findAllSubscriptions,
  getSubscribersByPlan,
  getSubscribersCount
};
