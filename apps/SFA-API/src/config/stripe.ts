import Stripe from 'stripe';
import { env } from './env';


if (!env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is missing. Stripe actions will fail.');
}

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-22.accredited' as any, // Stable version compatible with standard Stripe libraries
    })
  : null;
