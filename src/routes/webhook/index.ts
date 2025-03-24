import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import authentication from '../../auth/authentication';
import { ProtectedRequest } from '../../types/app-request';
import WebhookRepo from '../../database/repository/WebhookRepo';
import { BadRequestError } from '../../core/ApiError';

const router = express.Router();
router.use(authentication);

router.post(
  '/create',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id: userId } = req.user;
    const {events} = req.body
    const checkExistingWebhook = await WebhookRepo.findOneWebhook({ userId, events: { $all: events  } });
    if (checkExistingWebhook) {
      throw new BadRequestError('user already has an active webhook');
    }
    const webhook = await WebhookRepo.createWebhook({ ...req.body, userId });

    new SuccessResponse('success', {
      data: webhook,
    }).send(res);
  }),
);

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id: userId } = req.user;
   const webhooks = await WebhookRepo.findAllWebhooks({userId})
 
    new SuccessResponse('success', {
      data:webhooks
    }).send(res);
  }),
);
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id: userId } = req.user;
    const {id} = req.params;
   const webhooks = await WebhookRepo.findOneWebhook({userId,_id:id})
 
    new SuccessResponse('success', {
      data:webhooks
    }).send(res);
  }),
);



router.put(
  '/update/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id: userId } = req.user;
    const {id} = req.params;
    const { url, events, isActive, description } = req.body;
    const updateData: Record<string, any> = {};
    if (url !== undefined) {
      updateData.url = url;
    }
    
    if (events !== undefined) {
      updateData.events = events;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
   
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('No update fields provided');
    }
    const webhook = await WebhookRepo.updateWebhook({
      _id:id, 
      userId
    }, {
      $set:{
        ...updateData
      }
    })

    new SuccessResponse('success', {
      data: webhook,
    }).send(res);
  }),
);



export default router;