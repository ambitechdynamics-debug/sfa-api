import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  createCheckoutSession,
  createBillingPortalSession,
  handleWebhook,
} from './stripe.controller';

const router = Router();

// Stripe Checkout Session Creation (requires auth)
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);

// Stripe Billing Portal Redirect (requires auth)
router.post('/create-billing-portal-session', authMiddleware, createBillingPortalSession);

// Webhook is consumed by Stripe and verified via signatures (no custom auth)
router.post('/webhook', handleWebhook);

export default router;
