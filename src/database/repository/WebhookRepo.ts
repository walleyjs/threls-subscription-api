import Webhook, {WebhookModel} from "../model/Webhook";

async function findOneWebhook(where: any): Promise<Webhook | null> {
  return WebhookModel.findOne(where).lean().exec();
}

async function createWebhook(params: any): Promise<Webhook> {
  return WebhookModel.create({ ...params });
}

async function findAllWebhooks(where: any): Promise<Webhook[] | [] | null> {
  return WebhookModel.find(where).sort({ isDefault: -1, createdAt: -1 }).lean().exec();
}

async function updateWebhook(where: any, set: any): Promise<boolean> {
  await WebhookModel.updateMany(where, set, { new: true });

  return true;
}

export default {
  findOneWebhook,
  createWebhook,
  findAllWebhooks,
  updateWebhook
};