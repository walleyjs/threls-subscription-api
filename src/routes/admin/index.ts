import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import _, { values } from 'lodash';
import authentication from '../../auth/authentication';
import { ProtectedRequest } from '../../types/app-request';
import TransactionRepo from '../../database/repository/TransactionRepo';
import SubscriptionRepo from '../../database/repository/SubscriptionRepo';
import PlanRepo from '../../database/repository/PlanRepo';
import authorization from '../../auth/authorization';
import FeatureRepo from '../../database/repository/FeatureRepo';
import { BadRequestError } from '../../core/ApiError';
import PlanFeatureRepo from '../../database/repository/PlanFeatureRepo';
import mongoose from 'mongoose';
import UserRepo from '../../database/repository/UserRepo';


const router = express.Router();
router.use(authentication, authorization);


router.get(
  '/subscribers',
  asyncHandler(async (req: ProtectedRequest, res) => {
  
      const subscriptions = await SubscriptionRepo.findAllSubscriptions({}) ;
  
      new SuccessResponse('success', {
        data: subscriptions,
      }).send(res);
    }),
);

router.get(
  '/stats',
  asyncHandler(async (req: ProtectedRequest, res) => {
   
    const [
      totalSubscribers,
      activeSubscribers,
      trialSubscribers,
      canceledSubscribers,
      pendingSubscribers,
      pastDueSubscribers,
      expiredSubscribers,
    ] = await Promise.all([
      SubscriptionRepo.getSubscribersCount({}),
      SubscriptionRepo.getSubscribersCount({status:'active'}),
      SubscriptionRepo.getSubscribersCount({status:'trial'}),,
       SubscriptionRepo.getSubscribersCount({status:'canceled'}),
       SubscriptionRepo.getSubscribersCount({status:'pending'}),,
       SubscriptionRepo.getSubscribersCount({status:'past_due'}),,
       SubscriptionRepo.getSubscribersCount({status:'expired'}),
    ]);

  const   subscriptionPlans= await  PlanRepo.getPlansCount({isActive:true});
   const  totalRevenuedata = await  TransactionRepo.getRevenueMetrics({});
const totalRevenue = totalRevenuedata.length > 0 ? totalRevenuedata[0].amount : 0;
   
    new SuccessResponse('success', {
      data: {
        totalSubscribers,
        activeSubscribers,
        trialSubscribers,
        canceledSubscribers,
        pendingSubscribers,
        pastDueSubscribers,
        expiredSubscribers,
        subscriptionPlans,
        totalRevenue,
      },
    }).send(res);
  }),
);


router.get(
  '/features',
  asyncHandler(async (req: ProtectedRequest, res) => {
   const features = await FeatureRepo.findAllFeatures()
 
    new SuccessResponse('success', {
      data:features
    }).send(res);
  }),
);

router.post(
  '/create-feature',
  asyncHandler(async (req: ProtectedRequest, res) => {

   const features = await FeatureRepo.createFeature(req.body)
 
    new SuccessResponse('success', {
      data:features
    }).send(res);
  }),
);

router.post(
  '/create-plan',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { name, description, price, currency, billingCycle, displayOrder, trialPeriodDays, features, isActive } = req.body
    const existingPlan = await PlanRepo.findOnePlan({
      name,
      billingCycle
    });
    
    if (existingPlan) {
      throw new BadRequestError( `A plan with name "${name}" and ${billingCycle} billing cycle already exists`)
    }

    const planBody ={
      name, description, price, currency, billingCycle, 
      isActive: isActive !== undefined ? isActive : true,
      trialPeriodDays: trialPeriodDays || 0,
      displayOrder: displayOrder || 0
    }
   const plan = await PlanRepo.createPlan(planBody);
   const featureIds = features.map((f: { featureId: any; }) => f.featureId);
   const existingFeatures = await FeatureRepo.findFeatures({ _id: { $in: featureIds } });
   if (existingFeatures.length !== featureIds.length) {
    throw new BadRequestError( 'One or more features do not exist')
  }
  const planFeatures = [];
  for (const feature of features) {
    const planFeature = await PlanFeatureRepo.updatePlanFeature(
      { 
        planId:plan._id,
        featureId: feature.featureId
      },
      {
        $set: {
          isEnabled: feature.isEnabled !== undefined ? feature.isEnabled : true,
          value: feature.value,
          customDescription: feature.description
        }
      }, {upsert: true, new: true}
    );
    
    planFeatures.push(planFeature);
  }

  const updatedPlanWithFeatures = await PlanFeatureRepo.findPlanFeature({planId:plan._id});
 
    new SuccessResponse('success', {
      data:updatedPlanWithFeatures
    }).send(res);
  }),
);


router.put(
  '/update-plan/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const {id} = req.params;
    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      trialPeriodDays,
      displayOrder,
      isActive,
      features
    } = req.body;
    const existingPlan = await PlanRepo.findOnePlan({_id:id});
    if (!existingPlan) {
      throw new BadRequestError('Plan not found');
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    const planUpdateData = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number.parseFloat(price) }),
      ...(currency !== undefined && { currency }),
      ...(billingCycle !== undefined && { billingCycle }),
      ...(trialPeriodDays !== undefined && { trialPeriodDays: Number.parseInt(trialPeriodDays) }),
      ...(displayOrder !== undefined && { displayOrder: Number.parseInt(displayOrder) }),
      ...(isActive !== undefined && { isActive })
    };

    if (Object.keys(planUpdateData).length > 0) {
      await PlanRepo.updatePlan({_id:id}, { $set: planUpdateData }, { upsert: true, new: true, session });
   
    }

    if (features && Array.isArray(features)) {
      for (const feature of features) {
        if (!feature.featureId) continue;
        let limitValue = feature.limitValue;
        if (limitValue !== undefined) {
          if (limitValue === 'true' || limitValue === 'false') {
            limitValue = limitValue === 'true';
          } else if (!isNaN(Number(limitValue))) {
            limitValue = Number(limitValue);
          }
      }
      
      await PlanFeatureRepo.updatePlanFeature({ planId:id, featureId: feature.featureId }, {
        
          $set: { 
            isEnabled: feature.isEnabled !== undefined ? feature.isEnabled : true,
            value: limitValue,
            customDescription: feature.customDescription
          },
           
        
      }, { upsert: true, new: true, session })
    }
  }
  await session.commitTransaction();
  session.endSession();

  const plans = await PlanFeatureRepo.findPlanFeature({planId:id})
    new SuccessResponse('success', {
      data: plans,
    }).send(res);
  }),
);

router.put(
  '/delete-plan/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const {id} = req.params;
   
    const existingPlan = await PlanRepo.findOnePlan({_id:id});
    if (!existingPlan) {
      throw new BadRequestError('Plan not found');
    }
  
      
    const plan=  await PlanRepo.updatePlan({ _id:id }, {
        
          $set: { 
          isActive:false
          },
           
        
      }, { upsert: true, new: true })
    
    new SuccessResponse('success', {
      data: plan,
    }).send(res);
  }),
);

router.get(
  '/subscribers/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const {id} = req.params;
      const subscription = await SubscriptionRepo.findOneSubscription({_id:id}) ;
  
      new SuccessResponse('success', {
        data: subscription,
      }).send(res);
    }),
);


router.get(
  '/transactions',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
   
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
    
      let userIds: string[] = [];
      if (typeof search === 'string' && search.trim()) {
        const searchRegex = new RegExp(search, 'i');
        const users = await UserRepo.findUser({
          $or: [
            { email: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex }
          ]
        })

        if(!users) return;
        userIds = users.map(user => user._id.toString());
      }
      
    
      filter.$or = [
        { invoiceNumber: typeof search === 'string' ? new RegExp(search, 'i') : search },
        { providerTransactionId: typeof search === 'string' ? new RegExp(search, 'i') : search },
        ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : [])
      ];
    }
    

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const transactions = await TransactionRepo.findAllTransactionsAdmin(filter,sortOptions, skip, limitNum)
    const totalCount = await TransactionRepo.transactionCount(filter)
  
      new SuccessResponse('success', {
        data: { transactions,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(totalCount / limitNum)
          }},
      }).send(res);
    }),
);
router.get(
  '/transactions/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
   
   
    const { id } = req.params;
    const paymentMethods = await TransactionRepo.findOneTransaction({
     
      _id:id
    });
   
    new SuccessResponse('success', {
      data: paymentMethods,
    }).send(res);
  }),
);



export default router;
