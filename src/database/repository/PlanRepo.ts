import Plan, {PlanModel} from "../model/Plan";
import { Types } from "mongoose";

async function findPlanId(id: Types.ObjectId): Promise<Plan | null> {
  return PlanModel.findById(id).lean().exec();
}

async function findAllPlans():Promise<Plan[]>{
  return PlanModel.find({isActive:true}).sort({  displayOrder: 1 }).lean().exec();
}

export default {
  findPlanId,
  findAllPlans
}