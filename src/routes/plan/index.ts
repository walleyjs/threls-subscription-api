import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import PlanRepo from '../../database/repository/PlanRepo';
import PlanFeatureRepo from '../../database/repository/PlanFeatureRepo';
import FeatureRepo from '../../database/repository/FeatureRepo';
import { PublicRequest } from 'app-request';
import { BadRequestError } from '../../core/ApiError';
import validator from '../../helpers/validator';
import asyncHandler from '../../helpers/asyncHandler';
import _, { values } from 'lodash';
import authentication from '../../auth/authentication';

const router = express.Router();

router.get(
  '/plan-features',
  asyncHandler(async (req: PublicRequest, res) => {
    const plans = await PlanRepo.findAllPlans();

    const plansWithFeatures = await Promise.all(
      plans.map(async (plan) => {
        const planFeatures = await PlanFeatureRepo.findPlanFeature(
         { planId: plan._id}
        );

        const formattedFeatures = planFeatures.map((pf) => {
          const feature = pf.featureId as any;
          return {
            id: feature._id,
            name: feature.name,
            description: pf.customDescription || feature.description,
            included: pf.isEnabled,
            value: pf.value || feature.defaultLimitValue,
            category: feature.category,
            displayOrder: feature.displayOrder,
          };
        });
        return {
          ...plan,
          features: formattedFeatures,
        };
      }),
    );

    const groupedPlans = {
      monthly: plansWithFeatures.filter(plan => plan.billingCycle === 'monthly'),
      yearly: plansWithFeatures.filter(plan => plan.billingCycle === 'yearly')
    };

    new SuccessResponse('success', {
      data: groupedPlans,
    }).send(res);
  }),
);

router.get('/plan-features/comparison', async (req:PublicRequest, res) => {
  const plans = await PlanRepo.findAllPlans();
  const features = await FeatureRepo.findAllFeatures();
  const allPlanFeatures = await PlanFeatureRepo.findPlanFeature({
    planId: { $in: plans.map((p) => p._id) },
  });

  const planFeatureLookup:any = {};
    allPlanFeatures.forEach(pf => {
      const key = `${pf.planId.toString()}-${pf.featureId._id.toString()}`;
      planFeatureLookup[key] = {
        isEnabled: pf.isEnabled,
        value: pf.value || pf.featureId.defaultLimitValue,
        customDescription: pf.customDescription || pf.featureId.description
      };
    });

    

    const featureMatrix = features.map(feature => {
      const featureInPlans = plans.map(plan => {
        const key = `${plan._id.toString()}-${feature._id.toString()}`;
        const planFeature = planFeatureLookup[key] || { 
          isEnabled: false, 
          value: null, 
          customDescription: null 
        };
        
        return {
          planId: plan._id,
          planName: plan.name,
          included: planFeature.isEnabled,
          value: planFeature.value,
          customDescription: planFeature.customDescription
        };
      });
      
      return {
        id: feature._id,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        displayOrder: feature.displayOrder,
        inPlans: featureInPlans
      };
    });
    const comparedResult = {
      plans: plans.map(p => ({ 
        id: p._id, 
        name: p.name, 
        billingCycle: p.billingCycle,
        price: p.price,
        currency: p.currency
      })),
      features: featureMatrix
    };
new SuccessResponse('success', {
  data: comparedResult,
}).send(res);
});

export default router;
