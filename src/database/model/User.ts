import { model, Schema, Types } from 'mongoose';

export const DOCUMENT_NAME = 'User';
export const COLLECTION_NAME = 'users';

export enum RoleCode {
  CUSTOMER = 'CUSTOMER',
  SUPER_ADMIN = 'ESUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export default interface User {
  _id: Types.ObjectId;
 firstName?: string;
 lastName?: string;
  email?: string;
  password?: string;
  role: string;
  verified?: boolean;
  isActive?: boolean;
  updatedAt?:Date;
  createdAt?:Date;
}

const schema = new Schema<User>(
  {
    firstName: {
      type: Schema.Types.String,
      trim: true,
      maxlength: 200,
    },
    lastName: {
      type: Schema.Types.String,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: Schema.Types.String,
      unique: true,
      sparse: true, 
      trim: true,
    },
    password: {
      type: Schema.Types.String,
      select: false,
    },
    role: {
       type: Schema.Types.String,
           required: true,
           enum: Object.values(RoleCode),
    },
    verified: {
      type: Schema.Types.Boolean,
      default: false,
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

schema.index({ _id: 1, isActive: 1 });
schema.index({ email: 1 });
schema.index({ isActive: 1 });

export const UserModel = model<User>(DOCUMENT_NAME, schema, COLLECTION_NAME);
