import { Types } from 'mongoose';
import PaymentMethod, { PaymentMethodModel } from '../model/PaymentMethod';

async function createPaymentMethod(
  params: PaymentMethod,
): Promise<PaymentMethod> {
  return PaymentMethodModel.create({ ...params });
}

async function findOnePaymentMethod(where: any): Promise<PaymentMethod | null> {
  return PaymentMethodModel.findOne(where);
}

async function updatePaymentMethod(
 where:any, set:any
): Promise<boolean> {
  await PaymentMethodModel.updateMany(
   where,
   set,
   { new: true }
  );

  return true;
}

export default {
  createPaymentMethod,
  findOnePaymentMethod,
  updatePaymentMethod,
};
