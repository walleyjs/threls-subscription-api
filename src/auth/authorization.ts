import express from 'express';
import { ProtectedRequest } from 'app-request';
import { AuthFailureError } from '../core/ApiError';
import asyncHandler from '../helpers/asyncHandler';
import { RoleCode } from '../database/model';

const router = express.Router();

export default router.use(
  asyncHandler(async (req: ProtectedRequest, res, next) => {
    if (!req.user || !req.user.role || !req.currentRoleCode)
      throw new AuthFailureError('Permission denied');

    let authorized = false;
    if (
      req.user.role === RoleCode.ADMIN ||
      req.user.role === RoleCode.SUPER_ADMIN
    ) {
      authorized = true;
    }

    if (!authorized) throw new AuthFailureError('Permission denied');

    return next();
  }),
);
