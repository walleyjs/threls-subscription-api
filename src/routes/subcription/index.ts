import express from 'express';
import { FailureMsgResponse, SuccessResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import _, { values } from 'lodash';
import authentication from '../../auth/authentication';
import validator from '../../helpers/validator';
import schema from './schema';
import { ProtectedRequest } from '../../types/app-request';
import SubscriptionRepo from '../../database/repository/SubscriptionRepo';
import Logger from '../../core/Logger';
import { BadRequestError, NotFoundError } from '../../core/ApiError';
import PlanRepo from '../../database/repository/PlanRepo';
import PaymentMethodRepo from '../../database/repository/PaymentMethodRepo';
import TransactionRepo from '../../database/repository/TransactionRepo';
import { createTransaction } from '../../services/paymentService';
import { stat } from 'fs';
import { Types } from 'mongoose';

const router = express.Router();
router.use(authentication);

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id: userId } = req.user;
    const subscriptions = await SubscriptionRepo.findAllSubscriptions({
      userId,
    });

    new SuccessResponse('success', {
      data: subscriptions,
    }).send(res);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id: userId } = req.user;
    const { id } = req.params;
    const subscription = await SubscriptionRepo.findOneSubscription({
      _id: id,
      userId,
    });

    new SuccessResponse('success', {
      data: subscription,
    }).send(res);
  }),
);

router.post(
  '/create',
  validator(schema.subscriptionCreate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { planId, paymentMethodId } = req.body;
    const { _id: userId } = req.user;

    const plan = await PlanRepo.findPlanById(planId);
    if (!plan || !plan.isActive)
      throw new NotFoundError('Plan not found or inactive');

    const paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
      _id: paymentMethodId,
      userId,
    });
    if (!paymentMethod) throw new NotFoundError('Payment method not found');

    const existingSubscription = await SubscriptionRepo.findOneSubscription({
      userId,
      status: 'active',
      planId,
    });
    if (existingSubscription)
      throw new BadRequestError(
        'user already has an active subscription to this plan',
      );

    const now = new Date();
    const currentPeriodEnd = new Date();
    if (plan.billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (plan.billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    const subscription = await SubscriptionRepo.createSubscription({
      planId,
      paymentMethodId,
      currentPeriodStart: now,
      currentPeriodEnd,
      status: plan.trialPeriodDays > 0 ? 'trial' : 'pending',
      startDate: now,
      trialEndDate:
        plan.trialPeriodDays > 0
          ? new Date(now.getTime() + plan.trialPeriodDays * 24 * 60 * 60 * 1000)
          : null,
      userId,
    });
    if (plan.trialPeriodDays === 0) {
      const transaction = await createTransaction({
        subscriptionId: subscription._id,
        userId,
        planId,
        amount: plan.price,
        currency: plan.currency,
        paymentMethodId,
      });
      if (transaction.status === 'succeeded') {
        await SubscriptionRepo.updateSubscription(
          { _id: subscription._id },
          {
            $set: {
              status: 'active',
              lastTransactionId: transaction._id,
            },
          },
        );
      } else {
        await SubscriptionRepo.updateSubscription(
          { _id: subscription._id },
          {
            $set: {
              lastTransactionId: transaction._id,
            },
          },
        );
        throw new FailureMsgResponse('Payment failed');
      }
    }
    Logger.info(`Subscription created for user ${userId}`);

    const updatedSubscription = await SubscriptionRepo.findOneSubscription({
      _id: subscription._id,
    });

    new SuccessResponse('Subscription created', updatedSubscription).send(res);
  }),
);

router.post(
  '/:subscriptionId/retry',
  validator(schema.subscriptionRetry),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { paymentMethodId } = req.body;
    const { _id: userId } = req.user;
    const { subscriptionId } = req.params;

    const subscription = await SubscriptionRepo.findOneSubscription({
      userId,
      status: 'active',
      _id: subscriptionId,
    });
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (
      !['failed', 'past_due', 'pending', 'expired', 'trial'].includes(
        subscription.status,
      )
    ) {
      throw new BadRequestError(
        'This subscription does not need payment retry',
      );
    }

    const plan = await PlanRepo.findPlanById(
      new Types.ObjectId(subscription.planId.toString()),
    );

    if (!plan || !plan.isActive)
      throw new NotFoundError('Plan not found or inactive');

    const methodToUse = paymentMethodId || subscription.paymentMethodId;

    if (paymentMethodId) {
      const paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
        _id: paymentMethodId,
        userId,
      });

      if (!paymentMethod) throw new NotFoundError('Payment method not found');
    }

    const transaction = await createTransaction({
      subscriptionId: subscription._id,
      userId,
      planId: new Types.ObjectId(subscription.planId.toString()),
      amount: plan.price,
      currency: plan.currency,
      paymentMethodId: methodToUse,
    });

    if (transaction.status === 'succeeded') {
      let currentPeriodStart = new Date();
      let currentPeriodEnd = new Date();

      if (plan.billingCycle === 'monthly') {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else if (plan.billingCycle === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }
      await SubscriptionRepo.updateSubscription(
        { _id: subscription._id },
        {
          $set: {
            status: 'active',
            lastTransactionId: transaction._id,
            currentPeriodStart,
            currentPeriodEnd,
            ...(paymentMethodId && { paymentMethodId }),
          },
        },
      );
    } else {
      await SubscriptionRepo.updateSubscription(
        { _id: subscription._id },
        {
          $set: {
            lastTransactionId: transaction._id,
            failedAttempts: (subscription.failedAttempts || 0) + 1,
          },
        },
      );
      throw new FailureMsgResponse('Payment failed');
    }

    const updatedSubscription = await SubscriptionRepo.findOneSubscription({
      _id: subscription._id,
    });
    new SuccessResponse('Subscription created', updatedSubscription).send(res);
  }),
);

router.post(
  '/:subscriptionId/cancel',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { immediate } = req.body;
    const { _id: userId } = req.user;
    const { subscriptionId } = req.params;

    const subscription = await SubscriptionRepo.findOneSubscription({
      userId,
      _id: subscriptionId,
    });
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (subscription.status === 'canceled') {
      throw new BadRequestError('Subscription is already canceled');
    }

    if (immediate) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    await SubscriptionRepo.updateSubscription(
      { _id: subscription._id },
      {
        $set: {
          status: subscription.status,
          canceledAt: subscription.canceledAt,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
      },
    );

    const updatedSubscription = await SubscriptionRepo.findOneSubscription({
      _id: subscription._id,
    });
    new SuccessResponse('Subscription created', updatedSubscription).send(res);
  }),
);

export default router;
