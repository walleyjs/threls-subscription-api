import { model, Schema, Types } from 'mongoose';
import User from './User';
import Plan from './Plan';
import Transaction from './Transaction';
const DOCUMENT_NAME = 'Subscription';
const COLLECTION_NAME = 'subscriptions';

export default interface Subscription {
  _id: Types.ObjectId;
  userId: User | Types.ObjectId;
  planId: Plan;
  status: "active" | "canceled" | "expired" | "trial" | "pending";
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;       
  canceledAt: Date | null;
  cancelAtPeriodEnd: boolean;  
  paymentMethodId: string;
  lastBillingAttempt: Date | null;
  lastTransactionId:Transaction;
  failedAttempts: number;      
  metadata: Record<string, any>;
}

const schema = new Schema<Subscription>(
  {
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
    status: {
      type: Schema.Types.String,
      required: true,
      default: "pending",
      enum: ["active", "canceled", "expired", "trial", "pending"],
    },
    startDate: {
      type: Schema.Types.Date,
      required: true,
    },
    currentPeriodStart: {
      type: Schema.Types.Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Schema.Types.Date,
      required: true,
    },
    canceledAt: {
      type: Schema.Types.Date,
      required: false,
    },
    cancelAtPeriodEnd: {
      type: Schema.Types.Boolean,
      required: false,
    },
    paymentMethodId: {
      type: Schema.Types.String,
      required: true,
    },
    lastBillingAttempt: {
      type: Schema.Types.Date,
      required: false,
    },
    lastTransactionId:{
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'Transaction',
    },
    failedAttempts: {
      type: Schema.Types.Number,
      default: 0,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
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

schema.index({ userId: 1 });
schema.index({ status: 1 });

schema.methods.cancel = async function(immediate = false) {
  if (immediate) {
    this.status = 'canceled';
    this.canceledAt = new Date();
  } else {
    this.cancelAtPeriodEnd = true;
  }
  return this.save();
};

export const SubscriptionModel = model<Subscription>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME)