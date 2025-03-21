import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import _, { values } from 'lodash';
import authentication from '../../auth/authentication';
import validator from '../../helpers/validator';
import schema from './schema';
import { ProtectedRequest } from '../../types/app-request';
import PaymentMethodRepo from '../../database/repository/PaymentMethodRepo';
import Logger from '../../core/Logger';
import { BadRequestError } from '../../core/ApiError';

const router = express.Router();
router.use(authentication);

router.post('/create', validator(schema.paymentMethodCreate), asyncHandler(async (req:ProtectedRequest, res)=>{
  const {  type, details, isDefault = false } = req.body;
  const {_id:userId} = req.user

  if (type === 'card') {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (details.expiryYear < currentYear || 
        (details.expiryYear === currentYear && details.expiryMonth < currentMonth)) {
          throw new BadRequestError('Card is expired');
    }
  }

  if (isDefault) {
    await PaymentMethodRepo.updatePaymentMethod({ userId, isDefault: true },  { $set: { isDefault: false } })
  }

  const paymentMethod = await PaymentMethodRepo.createPaymentMethod(req.body)
    Logger.info(`Payment method created for user ${userId}`);
  
    new SuccessResponse('success', {
      data: paymentMethod,
    }).send(res);
}))

router.post('/update/:id', validator(schema.paymentMethodUpdate), asyncHandler(async (req:ProtectedRequest, res)=>{
  const {  type, details, billingAddress, isDefault = false } = req.body;
  const {_id:userId} = req.user
  const {id} = req.params

  const paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
    _id: id,
    userId
  });

  if (!paymentMethod)  throw new BadRequestError('Payment method not found');

 

  if (details) {
    if (details.expiryMonth && details.expiryYear) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (details.expiryYear < currentYear || 
          (details.expiryYear === currentYear && details.expiryMonth < currentMonth)) {
            throw new BadRequestError('Card is expired');
      }
    }

    paymentMethod.details = {
      ...paymentMethod.details,
      ...details
    };
  }

  if (billingAddress) {
   
    paymentMethod.billingAddress = {
      ...paymentMethod.billingAddress,
      ...billingAddress
    };
  }
  if (isDefault !== undefined) {
    paymentMethod.isDefault = isDefault;
  }
  const updatedPaymentMethod = await PaymentMethodRepo.updatePaymentMethod( { _id: id, userId }, { 
    $set: {
      ...(details && { details: { ...paymentMethod.details, ...details } }),
      ...(billingAddress && { billingAddress: { ...paymentMethod.billingAddress, ...billingAddress } }),
      ...(isDefault !== undefined && { isDefault: isDefault })
    } 
  },);
  
    new SuccessResponse('success', {
      data: updatedPaymentMethod,
    }).send(res);
}))

export default router;