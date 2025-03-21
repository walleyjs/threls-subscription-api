import { model, Schema, Types } from 'mongoose';
import User from './User';

const DOCUMENT_NAME = 'PaymentMethod';
const COLLECTION_NAME = 'paymentMethods';

export default interface PaymentMethod {
  _id: Types.ObjectId;
  userId: User;
  type: string;                 
  isDefault: boolean;
  details: {
    type: string;               
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  billingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  metadata: Record<string, any>;
}

const schema = new Schema<PaymentMethod>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type:{
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    isDefault:{
      type: Schema.Types.Boolean,
      required: true,
      trim: true,
    },
    details:{
      type:{
        type: Schema.Types.String,
         trim: true,
      },
      last4:{
        type: Schema.Types.String,
         trim: true,
      },
      expiryMonth:{
        type: Schema.Types.Number,
         trim: true,
      },
      expiryYear:{
        type: Schema.Types.Number,
         trim: true,
      },
    },
    billingAddress:{
      line1:{
        type: Schema.Types.String,
         trim: true,
      },
      line2:{
        type: Schema.Types.String,
        trim: true,
      },
      city:{
        type: Schema.Types.String,
        trim: true,
      },
      state:{
        type: Schema.Types.String,
        trim: true,
      },
      postalCode:{
        type: Schema.Types.String,
        trim: true,
      },
      country:{
        type: Schema.Types.String,
        trim: true,
      }
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },{
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
  },)

  export const PaymentMethodModel = model<PaymentMethod>(
    DOCUMENT_NAME,
    schema,
    COLLECTION_NAME)