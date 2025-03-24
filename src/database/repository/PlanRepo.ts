
import { Session } from "inspector";
import Plan, {PlanModel} from "../model/Plan";
import { Types } from "mongoose";

async function findPlanById(id: Types.ObjectId): Promise<Plan | null> {
  return PlanModel.findById(id).lean().exec();
}

async function findAllPlans():Promise<Plan[]>{
  return PlanModel.find({isActive:true}).sort({  displayOrder: 1 }).lean().exec();
}

async function createPlan(params: any): Promise<Plan> {
  return PlanModel.create({ ...params });
}

async function getPlansCount(where:any): Promise<any> {
 const plan = await PlanModel.countDocuments(where);
 return plan
}

async function findOnePlan(where: any): Promise<Plan | null> {
  return PlanModel.findOne(where).lean().exec();
}
async function updatePlan(where: any, set: any, option :any): Promise<boolean> {
  await PlanModel.updateMany(where, set,option);

  return true;
}

export default {
  findPlanById,
  findAllPlans,
  createPlan,
  getPlansCount,
  findOnePlan,
  updatePlan
}