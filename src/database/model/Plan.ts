import { model, Schema, Types } from 'mongoose';
const DOCUMENT_NAME = 'Plan';
const COLLECTION_NAME = 'plans';

export default interface IPlan {
  _id: Types.ObjectId;
  name: string;                
  description: string;
  price: number;
  currency: string;             
  billingCycle: "monthly" | "yearly";  
  trialPeriodDays: number;   
  displayOrder: number;  
  isActive: boolean;          
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IPlan>(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    description: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    price: {
      type: Schema.Types.Number,
      required: true,
    },
    currency: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    billingCycle: {
      type: Schema.Types.String,
      required: true,
      enum: ["monthly", "yearly"],
    },
    displayOrder: { type: Schema.Types.Number, default: 0 },
    trialPeriodDays: {
      type: Schema.Types.Number,
      required: true,
    },
    isActive: {
      type: Schema.Types.Boolean,
      default: true,
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

export const PlanModel = model<IPlan>(DOCUMENT_NAME, schema, COLLECTION_NAME);
