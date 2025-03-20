import { model, Schema, Types } from 'mongoose';
import Feature from './Feature';
import Plan from './Plan';
const DOCUMENT_NAME = 'PlanFeature';
const COLLECTION_NAME = 'planFeatures';

export default interface PlanFeature  {
  planId: Plan;
  featureId: Feature;
  isEnabled: boolean;
  value: any;         
  customDescription?: string;
}

const schema = new Schema<PlanFeature>(
  {
    planId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Plan',
    },
    featureId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Feature',
    },
    isEnabled: {
      type: Schema.Types.Boolean,
      default: true,
    },
    value: {
      type: Schema.Types.Mixed,
    },
    customDescription: {
      type: Schema.Types.String,
      required: false,
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collation: {
      locale: "en",
      caseLevel: true,
      strength: 2,
      backwards: true,
    },
  },
);

schema.index({ planId: 1, featureId: 1 },{ unique: true });


export const PlanFeatureModel = model<PlanFeature>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME)