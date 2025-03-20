import PlanFeature, { PlanFeatureModel}  from "../model/PlanFeature";
import FeatureRepo from "./FeatureRepo";
import { Types } from "mongoose";

async function findPlanFeatureById(id: Types.ObjectId): Promise<PlanFeature | null> {
  return PlanFeatureModel.findById(id).lean().exec();
}

async function findPlanFeatureByPlanId(planId: Types.ObjectId): Promise<PlanFeature[]> {
  const plan= await PlanFeatureModel.find({ planId })
    .populate({
      path: 'featureId',
    })
    .sort({ 'featureId.category': 1, 'featureId.displayOrder': 1 })
    .lean()
    .exec();
    return plan
}

export default {
  findPlanFeatureById,
  findPlanFeatureByPlanId
}