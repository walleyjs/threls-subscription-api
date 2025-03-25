import PlanRepo from '../database/repository/PlanRepo';
import SubscriptionRepo from '../database/repository/SubscriptionRepo';
import { createTransaction } from '../services/paymentService';
import Logger from '../core/Logger';

export async function processSubscriptionRenewals() {
  try {
    const now = new Date();
    Logger.info('Starting subscription renewal job');

    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const subscriptionsDue = await SubscriptionRepo.findAllSubscriptions({
      status: 'active',
      currentPeriodEnd: { $lte: dueDate },
      cancelAtPeriodEnd: false,
    });

    if (!subscriptionsDue) return;

    Logger.info(
      `Found ${subscriptionsDue.length} subscriptions due for renewal`,
    );

    for (const subscription of subscriptionsDue) {
      try {
        const plan = await PlanRepo.findPlanById(subscription.planId._id);

        if (!plan || !plan.isActive) {
          await SubscriptionRepo.updateSubscription(
            { _id: subscription._id },
            {
              $set: {
                status: 'canceled',
                canceledAt: now,
              },
            },
          );
          Logger.info(
            `Subscription ${subscription._id} canceled due to inactive plan`,
          );
          continue;
        }

        const transaction = await createTransaction({
          subscriptionId: subscription._id,
          userId: subscription.userId._id,
          planId: subscription.planId._id,
          amount: plan.price,
          currency: plan.currency,
          paymentMethodId: subscription.paymentMethodId,
        });

        if (transaction.status === 'succeeded') {
          const newPeriodStart = new Date();
          const newPeriodEnd = new Date();

          if (plan.billingCycle === 'monthly') {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
          } else if (plan.billingCycle === 'yearly') {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
          }
          await SubscriptionRepo.updateSubscription(
            { _id: subscription._id },
            {
              $set: {
                currentPeriodStart: newPeriodStart,
                currentPeriodEnd: newPeriodEnd,
                lastTransactionId: transaction._id,
                failedAttempts: 0,
              },
            },
          );

          Logger.info(`Subscription ${subscription._id} renewed successfully`);
        } else {
          subscription.failedAttempts = (subscription.failedAttempts || 0) + 1;

          if (subscription.failedAttempts >= 3) {
            subscription.status = 'past_due';
          }

          await SubscriptionRepo.updateSubscription(
            { _id: subscription._id },
            {
              $set: {
                failedAttempts: (subscription.failedAttempts || 0) + 1,
                status: subscription.status,
              },
            },
          );

          Logger.warn(
            `Subscription ${subscription._id} renewal failed, attempt #${subscription.failedAttempts}`,
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          Logger.error(
            `Error processing subscription ${subscription._id}: ${error.message}`,
          );
        } else {
          Logger.error(
            `Error processing subscription ${subscription._id}: ${String(
              error,
            )}`,
          );
        }
      }
    }

    await processTrialExpirations();

    Logger.info('Subscription renewal job completed');
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Subscription renewal job error: ${error.message}`);
    } else {
      Logger.error(`Subscription renewal job error: ${String(error)}`);
    }
  }
}

async function processTrialExpirations() {
  const now = new Date();

  const expiredTrials = await SubscriptionRepo.findAllSubscriptions({
    status: 'trial',
    trialEndDate: { $lte: now },
  });

  if (!expiredTrials) return;

  Logger.info(`Found ${expiredTrials.length} expired trials`);

  for (const subscription of expiredTrials) {
    try {
      const plan = await PlanRepo.findPlanById(subscription.planId._id);

      if (!plan || !plan.isActive) {
        subscription.status = 'canceled';
        subscription.canceledAt = now;
        await SubscriptionRepo.updateSubscription(
          { _id: subscription._id },
          {
            $set: {
              status: 'canceled',
              canceledAt: now,
            },
          },
        );
        continue;
      }

      const transaction = await createTransaction({
        subscriptionId: subscription._id,
        userId: subscription.userId._id,
        planId: subscription.planId._id,
        amount: plan.price,
        currency: plan.currency,
        paymentMethodId: subscription.paymentMethodId,
      });

      if (transaction.status === 'succeeded') {
        await SubscriptionRepo.updateSubscription(
          { _id: subscription._id },
          {
            $set: {
              status: 'active',
              astTransactionId: transaction._id,
            },
          },
        );

        Logger.info(`Trial subscription ${subscription._id} converted to paid`);
      } else {
        await SubscriptionRepo.updateSubscription(
          { _id: subscription._id },
          {
            $set: {
              status: 'past_due',
              failedAttempts: 1,
            },
          },
        );

        Logger.warn(`Trial subscription ${subscription._id} payment failed`);
      }
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(
          `Error processing trial subscription ${subscription._id}: ${error.message}`,
        );
      } else {
        Logger.error(
          `Error processing trial subscription ${subscription._id}: ${String(
            error,
          )}`,
        );
      }
    }
  }
}

export async function updateSubscriptionStatuses() {
  try {
    const now = new Date();
    Logger.info('Starting subscription status update job');

    const endOfPeriodCancellations =
      await SubscriptionRepo.findAllSubscriptions({
        status: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { $lte: now },
      });

    if (endOfPeriodCancellations && endOfPeriodCancellations.length > 0) {
      const result = await SubscriptionRepo.updateSubscription(
        {
          _id: { $in: endOfPeriodCancellations.map((s) => s._id) },
        },
        {
          $set: {
            status: 'canceled',
            canceledAt: now,
          },
        },
      );

      Logger.info(`Processed end-of-period cancellations`);
    }

    const gracePeriodDays = 14;
    const gracePeriodDate = new Date(
      now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000,
    );

    const expiredPastDue = await SubscriptionRepo.findAllSubscriptions({
      status: 'past_due',
      updatedAt: { $lte: gracePeriodDate },
    });

    if (expiredPastDue && expiredPastDue.length > 0) {
      const result = await SubscriptionRepo.updateSubscription(
        {
          _id: { $in: expiredPastDue.map((s) => s._id) },
        },
        {
          $set: {
            status: 'expired',
            expiredAt: now,
          },
        },
      );

      Logger.info(`Processed expired past-due subscriptions`);
    }

    Logger.info('Subscription status update job completed');
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Subscription status update job error: ${error.message}`);
    } else {
      Logger.error(`Subscription status update job error: ${String(error)}`);
    }
  }
}

if (require.main === module) {
  processSubscriptionRenewals()
    .then(() => {
      Logger.info('Manual subscription renewal completed');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error(`Manual subscription renewal failed: ${error.message}`);
      process.exit(1);
    });
}
