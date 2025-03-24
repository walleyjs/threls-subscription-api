import PaymentMethod, { PaymentMethodModel } from '../model/PaymentMethod';

async function createPaymentMethod(
  params: PaymentMethod,
): Promise<PaymentMethod> {
  return PaymentMethodModel.create({ ...params });
}

async function findOnePaymentMethod(where: any): Promise<PaymentMethod | null> {
  return PaymentMethodModel.findOne(where)
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

async function findAllPaymentMethods(
  where: any,
): Promise<PaymentMethod[] | [] | null> {
  return PaymentMethodModel.find(where)
    .sort({ isDefault: -1, createdAt: -1 })
    .lean()
    .exec();
}

async function updatePaymentMethod(where: any, set: any): Promise<boolean> {
  await PaymentMethodModel.updateMany(where, set, { new: true });

  return true;
}


async function deletePaymentMethod(id:string): Promise<boolean> {
  await PaymentMethodModel.findByIdAndDelete(id);

  return true;
}

export default {
  createPaymentMethod,
  findOnePaymentMethod,
  updatePaymentMethod,
  findAllPaymentMethods,
  deletePaymentMethod
};
