import { model, Schema, Types } from 'mongoose';
import User from './User';
import Plan from './Plan';
import Subscription from "./Subscription";
const DOCUMENT_NAME = 'Transaction';
const COLLECTION_NAME = 'transactions';



 export default interface Transaction {
  _id: Types.ObjectId;
  subscriptionId: Subscription;
  userId: User;
  planId: Plan;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paymentMethodId: Types.ObjectId;
  paymentMethodDetails: {
    type: string;              
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  invoiceNumber: string;      
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  metadata: Record<string, any>;
}


const schema = new Schema<Transaction>(
  {

    subscriptionId:{
      type:Schema.Types.ObjectId,
      required:true,
      ref:'Subscription'
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    planId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Plan',
    },
    amount: {
      type: Schema.Types.Number,
      required: true,
    },
    currency: {
      type: Schema.Types.String,
      required: true,
    },
    status:{
      type: Schema.Types.String,
      required: true,
      enum: ["pending", "succeeded", "failed", "refunded"],
    },
    paymentMethodId:{
      type:Schema.Types.ObjectId,
      required:false,
      ref:'PaymentMethod'
    },
    paymentMethodDetails: {
      type: {
        type: String,
        required: true,
      },
      last4: {
        type: String,
        required: true,
        maxlength: 4,
      },
      expiryMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      expiryYear: {
        type: Number,
        required: true,
      },
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    billingPeriodStart: {
      type: Schema.Types.Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Schema.Types.Date,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
},  {
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
})

schema.index({ subscriptionId: 1 });

export const TransactionModel = model<Transaction>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME)