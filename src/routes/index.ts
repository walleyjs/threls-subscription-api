import express from 'express';
import signup from './access/signup';
import login from './access/login';
import logout from './access/logout';
import token from './access/token';
import credential from './access/credential';
import paymethod from './subcription/paymentMethod';
import subscription from './subcription'
import profile from './profile';
import plan from './plan';
import Transaction from './subcription/transaction';
import Admin from './admin'
import Webhook from './webhook'

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
      status: 'ok',
      processEnv: process.env.NODE_ENV || 'not set',
      CURRENT_PROJECT: process.env.CURRENT_PROJECT,
    });
});

router.use('/signup', signup);
router.use('/login', login);
router.use('/logout', logout);
router.use('/token', token);
router.use('/credential', credential);
router.use('/profile', profile);
router.use('/plan', plan);
router.use('/subscription', subscription);
router.use('/payment-method', paymethod);
router.use('/transaction', Transaction);
router.use('/admin', Admin);
router.use('/webhook', Webhook);

export default router;
