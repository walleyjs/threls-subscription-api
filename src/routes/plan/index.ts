import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import PlanRepo from '../../database/repository/PlanRepo';
import PlanFeatureRepo from '../../database/repository/PlanFeatureRepo';
import {  PublicRequest } from 'app-request';
import { BadRequestError } from '../../core/ApiError';
import validator from '../../helpers/validator';
import asyncHandler from '../../helpers/asyncHandler';
import _, { values } from 'lodash';
import authentication from '../../auth/authentication';

const router = express.Router();


router.get('/plan-features', asyncHandler(async (req:PublicRequest, res)=>{

  const plans = await PlanRepo.findAllPlans();

  const plansWithFeatures = await Promise.all(plans.map(async (plan)=>{
    const planFeatures = await PlanFeatureRepo.findPlanFeatureByPlanId(plan._id);
   
    const formattedFeatures = planFeatures.map(pf =>{
      const feature = pf.featureId as any;
      return {
        id: feature._id ,
        name:feature.name,
        description: pf.customDescription || feature.description,
        included: pf.isEnabled,
        value: pf.value || feature.defaultLimitValue,
        category:feature.category,
        displayOrder: feature.displayOrder
      }
    })
    return {
      ...plan,
      features: formattedFeatures
    }
  }))

  new SuccessResponse('success', {
    data: plansWithFeatures,
  }).send(res);
}))

export default router;
