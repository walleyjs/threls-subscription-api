import { model, Schema, Types } from 'mongoose';
const DOCUMENT_NAME = 'Feature';
const COLLECTION_NAME = 'features';

export default interface Feature {
  _id: Types.ObjectId;
  name: string;                 
  description: string;
  key:string;
  category:string;
  isHighlighted: boolean;       
  limitType: string;
  defaultLimitValue: any;
  displayOrder: number;
  isActive: boolean;    
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<Feature>(
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
    key: { type: Schema.Types.String, required: true, unique: true,  trim: true },
  category: { type: Schema.Types.String, required: true,  trim: true },
    isHighlighted: {
      type: Schema.Types.Boolean,
      default: false,
    },
    limitType: {
      type: Schema.Types.String,
      default: "none",
      required: true,
      enum: ["boolean", "quantity", "none"],
    },
    defaultLimitValue: {
      type: Schema.Types.Mixed,
      default:null
    },
    displayOrder: { type: Schema.Types.Number, default: 0 },

    isActive: {
      type: Schema.Types.Boolean,
      default: true,
    },
    isDeleted: {
      type: Schema.Types.Boolean,
      default: false,
      select: false,
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


export const FeatureModel = model<Feature>(DOCUMENT_NAME, schema, COLLECTION_NAME);
