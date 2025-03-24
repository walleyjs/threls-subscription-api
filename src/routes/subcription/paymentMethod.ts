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

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
   
    const { _id: userId } = req.user;
    const paymentMethods = await PaymentMethodRepo.findAllPaymentMethods({
      userId,
    });
   
    new SuccessResponse('success', {
      data: paymentMethods,
    }).send(res);
  }),
);

router.post(
  '/create',
  validator(schema.paymentMethodCreate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { type, details, isDefault = false } = req.body;
    const { _id: userId } = req.user;

    if (type === 'card') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      details.last4= details.cardNumber.slice(-4);

      if (
        details.expiryYear < currentYear ||
        (details.expiryYear === currentYear &&
          details.expiryMonth < currentMonth)
      ) {
        throw new BadRequestError('Card is expired');
      }
    }

    if (isDefault) {
      await PaymentMethodRepo.updatePaymentMethod(
        { userId, isDefault: true },
        { $set: { isDefault: false } },
      );
    }

    const paymentMethod = await PaymentMethodRepo.createPaymentMethod({...req.body, userId});
    Logger.info(`Payment method created for user ${userId}`);

    new SuccessResponse('success', {
      data: paymentMethod,
    }).send(res);
  }),
);

router.put(
  '/update/:id',
  validator(schema.paymentMethodUpdate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { type, details, billingAddress, isDefault = false } = req.body;
    const { _id: userId } = req.user;
    const { id } = req.params;

    const paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
      _id: id,
      userId,
    });

    if (!paymentMethod) throw new BadRequestError('Payment method not found');

    if (details) {
      if (details.expiryMonth && details.expiryYear) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (
          details.expiryYear < currentYear ||
          (details.expiryYear === currentYear &&
            details.expiryMonth < currentMonth)
        ) {
          throw new BadRequestError('Card is expired');
        }
      }

      paymentMethod.details = {
        ...paymentMethod.details,
        ...details,
      };
    }

    if (billingAddress) {
      paymentMethod.billingAddress = {
        ...paymentMethod.billingAddress,
        ...billingAddress,
      };
    }
    if (isDefault !== undefined) {
      paymentMethod.isDefault = isDefault;
    }
    const updatedPaymentMethod = await PaymentMethodRepo.updatePaymentMethod(
      { _id: id, userId },
      {
        $set: {
          ...(details && { details: { ...paymentMethod.details, ...details } }),
          ...(billingAddress && {
            billingAddress: {
              ...paymentMethod.billingAddress,
              ...billingAddress,
            },
          }),
          ...(isDefault !== undefined && { isDefault: isDefault }),
        },
      },
    );

    new SuccessResponse('success', {
      data: updatedPaymentMethod,
    }).send(res);
  }),
);

router.put(
  '/delete/:id',
  
  asyncHandler(async (req: ProtectedRequest, res) => {
   
    const { _id: userId } = req.user;
    const { id } = req.params;

    const paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
      _id: id,
      userId,
    });

    if (!paymentMethod) throw new BadRequestError('Payment method not found');

   const deleted = await PaymentMethodRepo.deletePaymentMethod(id);

    new SuccessResponse('success', {
      data: deleted,
    }).send(res);
  }),
);

router.get(
  '/default',
  asyncHandler(async (req: ProtectedRequest, res) => {
   
    const { _id: userId } = req.user;
    let paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({
      userId,
      isDefault: true
    });

    if (!paymentMethod) {
      paymentMethod = await PaymentMethodRepo.findOnePaymentMethod({ userId })
      
    }
   
    new SuccessResponse('success', {
      data: paymentMethod,
    }).send(res);
  }),
);

export default router;
