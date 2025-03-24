import { model, Schema, Types } from 'mongoose';
import User from './User';

 const DOCUMENT_NAME = 'Webhook';
const COLLECTION_NAME = 'webhooks';

export default interface Webhook {
  _id: Types.ObjectId;
  userId: User;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastStatus: string;
  lastResponse: string;
  failedAttempts: number;
}

const schema = new Schema<Webhook>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: Schema.Types.String,
      required: true,
    },
    secret: {
      type: Schema.Types.String,
      required: true,
    },
    events: {
      type: [Schema.Types.String],
      enum: [
        'subscription.created',
        'subscription.updated',
        'subscription.canceled',
        'subscription.renewed',
        'payment.succeeded',
        'payment.failed',
        'payment.refunded'
      ],
      required: true,
    },
    isActive: {
      type: Schema.Types.Boolean,
      default: true,
    },
    lastStatus: {
      type: Schema.Types.String,
      required: false,
    },
    lastResponse: {
      type: Schema.Types.String,
      required: false,
    },
    failedAttempts: {
      type: Schema.Types.Number,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collation: {
      locale: 'en',
      caseLevel: true,
      strength: 2,
      backwards: true,
    },
  },
);

export const WebhookModel = model<Webhook>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
