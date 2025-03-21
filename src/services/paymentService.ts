import PaymentMethodRepo from '../database/repository/PaymentMethodRepo';
import TransactionRepo from '../database/repository/TransactionRepo';
import { generateInvoiceNumber } from '../helpers/utils';
import { FailureMsgResponse } from '../core/ApiResponse';
import { NotFoundError } from '../core/ApiError';
import { Types } from 'mongoose';

// Mock payment processing (in a real system, this would integrate with a payment provider)
export async function processPayment(
  amount: number,
  currency: string,
  paymentMethodId: string,
) {
  try {
    const paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
      _id: paymentMethodId,
    });
    if (!paymentMethod) throw new NotFoundError('Payment method not found');

    const isSuccessful = Math.random() < 0.95;

    if (!isSuccessful) {
      throw new FailureMsgResponse('Payment failed');
    }

    return {
      providerTransactionId: `txn_${Date.now()}_${Math.floor(
        Math.random() * 1000000,
      )}`,
      status: 'succeeded',
      paymentMethod
    };
  } catch (error) {
    throw error;
  }
}

export async function createTransaction(params: {
  subscriptionId: Types.ObjectId;
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethodId: string;
}) {
  try {
    const {
      subscriptionId,
      userId,
      planId,
      amount,
      currency,
      paymentMethodId,
    } = params;

    const paymentResult = await processPayment(
      amount,
      currency,
      paymentMethodId,
    );

    const paymentMethod = paymentResult.paymentMethod;


    const transaction = await TransactionRepo.createTransaction({
      subscriptionId,
      userId,
      planId,
      amount,
      currency,
      status: paymentResult.status,
      paymentMethodId,
      paymentMethodDetails: {
        type: paymentMethod.type,
        last4: paymentMethod.details.last4,
        expiryMonth: paymentMethod.details.expiryMonth,
        expiryYear: paymentMethod.details.expiryYear,
      },
      providerTransactionId: paymentResult.providerTransactionId,
      invoiceNumber: generateInvoiceNumber(),
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(
        new Date().setMonth(new Date().getMonth() + 1),
      ),
    });

    return transaction;
  } catch (error) {
    const transaction = await TransactionRepo.createTransaction({
      subscriptionId: params.subscriptionId,
      userId: params.userId,
      planId: params.planId,
      amount: params.amount,
      currency: params.currency,
      status: 'failed',
      paymentMethodId: params.paymentMethodId,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      invoiceNumber: generateInvoiceNumber(),
    });

    return transaction;
  }
}

