import Joi from 'joi';

export default {
  paymentMethodCreate: Joi.object().keys({
    type: Joi.string().required().min(3).max(500),
   
    details: Joi.object({
      type: Joi.string().valid("visa", "mastercard", "amex", "discover").required(),
      expiryMonth: Joi.number().integer().min(1).max(12).required(),
      expiryYear: Joi.number().integer().min(new Date().getFullYear()).required(),
      cardNumber: Joi.string().required().min(3).max(500),
      cardholderName: Joi.string().min(3).max(500),
      cvc:Joi.string(),
    }).required(),
    billingAddress: Joi.object({
      line1: Joi.string().optional(),
      line2: Joi.string().allow(null, "").optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().length(2).uppercase().optional(), 
    }).optional(),
    isDefault: Joi.boolean().required(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({}), 
  }),
  paymentMethodUpdate: Joi.object().keys({
    type: Joi.string().min(3).max(500),
    details: Joi.object({
      type: Joi.string().valid("visa", "mastercard", "amex", "discover"),
      last4: Joi.string().length(4).pattern(/^\d{4}$/),
      expiryMonth: Joi.number().integer().min(1).max(12),
      expiryYear: Joi.number().integer().min(new Date().getFullYear()),
      cardholderName: Joi.string().min(3).max(500),
      cardNumber: Joi.string().required().min(3).max(500),
      cvc:Joi.string(),
    }),
    billingAddress: Joi.object({
      line1: Joi.string().optional(),
      line2: Joi.string().allow(null, "").optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().length(2).uppercase().optional(), 
    }).optional(),
    isDefault: Joi.boolean(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({}), 
  }),

  subscriptionCreate: Joi.object().keys({
    planId: Joi.string().required(),
    paymentMethodId: Joi.string().required(),
  }),
  subscriptionRetry: Joi.object().keys({
    paymentMethodId: Joi.string().required(),
  }),
  subscriptionCancel: Joi.object().keys({
    immediate: Joi.boolean().required(),
  }),
}