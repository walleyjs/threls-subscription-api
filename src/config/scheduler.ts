import cron from 'node-cron'
import { processSubscriptionRenewals, updateSubscriptionStatuses } from '../jobs/subscription.job';
import Logger from '../core/Logger';

export function initScheduler() {
  try {
    Logger.info('Initializing subscription scheduler');
    
    // Run renewals job daily at 1:00 AM
    cron.schedule('0 1 * * *', async () => {
      Logger.info('Running scheduled subscription renewal job');
      try {
        await processSubscriptionRenewals();
        Logger.info('Subscription renewal job completed successfully');
      } catch (error) {
        if (error instanceof Error) {
          Logger.error(`Subscription renewal job failed: ${error.message}`);
        } else {
          Logger.error('Subscription renewal job failed with an unknown error');
        }
      }
    });
    
    // Run status updates job daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      Logger.info('Running scheduled subscription status update job');
      try {
        await updateSubscriptionStatuses();
        Logger.info('Subscription status update job completed successfully');
      } catch (error) {
        if (error instanceof Error) {
          Logger.error(`Subscription status update job failed: ${error.message}`);
        } else {
          Logger.error('Subscription status update job failed with an unknown error');
        }
      }
    });
    
    Logger.info('Subscription scheduler initialized successfully');
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Failed to initialize scheduler: ${error.message}`);
    } else {
      Logger.error('Failed to initialize scheduler with an unknown error');
    }
  }
}