import PlanFeature, { PlanFeatureModel}  from "../model/PlanFeature";
import { Types } from "mongoose";

async function findPlanFeatureById(id: Types.ObjectId): Promise<PlanFeature | null> {
  return PlanFeatureModel.findById(id).lean().exec();
}

async function findPlanFeature(where:any): Promise<PlanFeature[]> {
  const plan= await PlanFeatureModel.find( where )
    .populate({
      path: 'featureId',
    })
    .sort({ 'featureId.category': 1, 'featureId.displayOrder': 1 })
    .lean()
    .exec();
    return plan
}

async function updatePlanFeature(where: any, set: any, option:any): Promise<boolean> {
  await PlanFeatureModel.updateMany(where, set,option);

  return true;
}

export default {
  findPlanFeatureById,
  findPlanFeature,
  updatePlanFeature
}