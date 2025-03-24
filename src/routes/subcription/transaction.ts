import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import _, { values } from 'lodash';
import authentication from '../../auth/authentication';
import schema from './schema';
import { ProtectedRequest } from '../../types/app-request';
import TransactionRepo from '../../database/repository/TransactionRepo';


const router = express.Router();
router.use(authentication);


router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
   
    const { _id: userId } = req.user;
    const paymentMethods = await TransactionRepo.findAllTransactions({
      userId,
    });
   
    new SuccessResponse('success', {
      data: paymentMethods,
    }).send(res);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
   
    const { _id: userId } = req.user;
    const { id } = req.params;
    const paymentMethods = await TransactionRepo.findOneTransaction({
      userId,
      _id:id
    });
   
    new SuccessResponse('success', {
      data: paymentMethods,
    }).send(res);
  }),
);



export default router;
