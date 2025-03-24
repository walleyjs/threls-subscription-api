import Feature, { FeatureModel } from "../model/Feature";
import { Types } from "mongoose";

async function findFeatureById(id: Types.ObjectId): Promise<Feature | null> {
  return FeatureModel.findById(id).lean().exec();
}

async function findFeatureByKey(key: string): Promise<Feature | null> {
  return FeatureModel.findOne({ key:
    key }).lean().exec();
}

async function findAllFeatures(): Promise<Feature[]> {
  return FeatureModel.find({isDeleted:false}).sort({ category: 1, displayOrder: 1 }).lean().exec();
}

async function createFeature(feature: Feature): Promise<Feature> {
  const newFeature = await FeatureModel.create({
    ...feature,
  });
  return newFeature.toObject();
}

async function updateFeature(
  id: Types.ObjectId,
  feature: Partial<Feature>,
): Promise<Feature | null> {
  await FeatureModel.updateOne({ _id: id
  }, { $set: { ...feature } }).lean().exec();
  return findFeatureById(id);
}

async function deleteFeature(id: Types.ObjectId): Promise<Feature | null> {
  return FeatureModel.findOneAndUpdate(
    { _id: id },
    { $set: { isDeleted: true } },
    { new: true }
  ).lean().exec();
}

async function findFeatures(where:any): Promise<Feature[]> {
  return FeatureModel.find(where).lean().exec();
}

export default {
  findFeatureById,
  findFeatureByKey,
  findAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  findFeatures
};
