import axios from 'axios';
import crypto from 'crypto';
import Logger from '../core/Logger';
import WebhookRepo from '../database/repository/WebhookRepo';

export type WebhookEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.renewed'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded';

function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

async function sendWebhook(
  webhook: any,
  eventType: WebhookEventType,
  payload: any,
) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const webhookPayload = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      created: timestamp,
      type: eventType,
      data: payload,
    };

    const signature = generateSignature(webhookPayload, webhook.secret);

    const response = await axios.post(webhook.url, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Id': webhookPayload.id,
        'X-Webhook-Timestamp': timestamp.toString(),
      },
      timeout: 10000,
    });

    await WebhookRepo.updateWebhook(
      { _id: webhook._id },
      {
        $set: {
          lastStatus: response.status.toString(),
          lastResponse:
            response.status >= 200 && response.status < 300
              ? 'success'
              : 'error',
          failedAttempts: 0,
        },
      },
    );

    Logger.info(
      `Webhook ${eventType} sent to ${webhook.url} - Status: ${response.status}`,
    );
    return true;
  } catch (error) {
    const failureReason =
      axios.isAxiosError(error) && error.response
        ? `Status ${error.response.status}: ${error.response.statusText}`
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    await WebhookRepo.updateWebhook(
      { _id: webhook._id },
      {
        $set: { lastResponse: failureReason },
        $inc: { failedAttempts: 1 },
      },
    );

    Logger.error(
      `Webhook ${eventType} failed for ${webhook.url}: ${failureReason}`,
    );
    return false;
  }
}

export async function dispatchWebhookEvent(
  userId: string,
  eventType: WebhookEventType,
  payload: any,
) {
  try {
    const webhooks = await WebhookRepo.findAllWebhooks({
      userId,
      isActive: true,
      events: { $in: [eventType] },
    });

    if (!webhooks) {
      Logger.error(
        `Failed to find webhooks for ${eventType} for user ${userId}`,
      );
      return;
    }

    if (webhooks.length === 0) {
      Logger.debug(
        `No webhooks registered for ${eventType} for user ${userId}`,
      );
      return;
    }

    const results = await Promise.allSettled(
      webhooks.map((webhook) => sendWebhook(webhook, eventType, payload)),
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;

    Logger.info(
      `Dispatched ${eventType} to ${webhooks.length} webhooks, ${successCount} succeeded`,
    );
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(
        `Failed to dispatch webhook event ${eventType}: ${error.message}`,
      );
    } else {
      Logger.error(
        `Failed to dispatch webhook event ${eventType}: ${String(error)}`,
      );
    }
  }
}
