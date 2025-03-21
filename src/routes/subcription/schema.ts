import Joi from 'joi';

export default {
  paymentMethodCreate: Joi.object().keys({
    type: Joi.string().required().min(3).max(500),
    details: Joi.object({
      type: Joi.string().valid("visa", "mastercard", "amex", "discover").required(),
      last4: Joi.string().length(4).pattern(/^\d{4}$/).required(),
      expiryMonth: Joi.number().integer().min(1).max(12).required(),
      expiryYear: Joi.number().integer().min(new Date().getFullYear()).required(),
    }).required(),
    billingAddress: Joi.object({
      line1: Joi.string().required(),
      line2: Joi.string().allow(null, "").optional(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().length(2).uppercase().required(), 
    }).required(),
    isDefault: Joi.boolean().required(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({}), 
  }),
  paymentMethodUpdate: Joi.object().keys({
    type: Joi.string().min(3).max(500),
    details: Joi.object({
      type: Joi.string().valid("visa", "mastercard", "amex", "discover"),
      last4: Joi.string().length(4).pattern(/^\d{4}$/),
      expiryMonth: Joi.number().integer().min(1).max(12),
      expiryYear: Joi.number().integer().min(new Date().getFullYear()).required(),
    }),
    billingAddress: Joi.object({
      line1: Joi.string().required(),
      line2: Joi.string().allow(null, "").optional(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string(),
      country: Joi.string().length(2).uppercase(), 
    }),
    isDefault: Joi.boolean(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({}), 
  }),

  subscriptionCreate: Joi.object().keys({
    planId: Joi.string().required(),
    paymentMethodId: Joi.string().required(),
  }),
}