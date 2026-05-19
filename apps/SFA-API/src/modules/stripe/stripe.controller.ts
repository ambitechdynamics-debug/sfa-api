import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { stripe } from '../../config/stripe';
import { getPlanLimits } from '../../utils/stripeLimits';

// Helper to resolve price ID based on plan and period
function getPriceId(plan: string, period: string): string | undefined {
  const planLower = plan.toLowerCase();
  const periodLower = period.toLowerCase();

  if (planLower === 'starter') {
    return periodLower === 'yearly' ? env.STRIPE_PRICE_STARTER_YEARLY : env.STRIPE_PRICE_STARTER_MONTHLY;
  }
  if (planLower === 'pro') {
    return periodLower === 'yearly' ? env.STRIPE_PRICE_PRO_YEARLY : env.STRIPE_PRICE_PRO_MONTHLY;
  }
  if (planLower === 'business') {
    return periodLower === 'yearly' ? env.STRIPE_PRICE_BUSINESS_YEARLY : env.STRIPE_PRICE_BUSINESS_MONTHLY;
  }
  return undefined;
}

// Create a Stripe checkout session for subscription
export async function createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!stripe) {
      res.status(503).json({ success: false, message: 'Stripe backend is not configured' });
      return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Non authentifié' });
      return;
    }

    const { plan, period } = req.body;
    if (!plan || !period) {
      res.status(400).json({ success: false, message: 'Plan et période requis' });
      return;
    }

    const priceId = getPriceId(plan, period);
    if (!priceId) {
      res.status(400).json({ success: false, message: 'Plan ou période invalide, ou Price ID non configuré' });
      return;
    }

    // Fetch user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // We allow multi-origin redirects. Resolve front URL.
    const origin = req.headers.origin as string;
    const fallbackAppUrl = env.APP_URL.split(',')[0].trim();
    const resolvedAppUrl = origin || fallbackAppUrl;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${resolvedAppUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${resolvedAppUrl}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan.toLowerCase(),
      },
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error: any) {
    console.error('Error in createCheckoutSession:', error);
    next(error);
  }
}

// Create a customer portal session for billing management
export async function createBillingPortalSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!stripe) {
      res.status(503).json({ success: false, message: 'Stripe backend is not configured' });
      return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      res.status(400).json({ success: false, message: "Aucune information de facturation Stripe disponible pour cet utilisateur." });
      return;
    }

    const origin = req.headers.origin as string;
    const fallbackAppUrl = env.APP_URL.split(',')[0].trim();
    const resolvedAppUrl = origin || fallbackAppUrl;

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${resolvedAppUrl}/dashboard/billing`,
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error: any) {
    console.error('Error in createBillingPortalSession:', error);
    next(error);
  }
}

// Secure webhook handler
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe) {
    res.status(503).send('Stripe not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).send('Webhook secret or signature missing');
    return;
  }

  let event: any;

  try {
    // Ensure req.body is parsed as raw buffer for validation
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log(`Stripe webhook event received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(customerId, subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        await syncSubscription(customerId, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        await cancelSubscription(customerId);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(customerId, subscription);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn(`Payment failed for invoice ${invoice.id} customer ${invoice.customer}`);
        // Optional: Update status in DB as unpaid/past_due
        const customerId = invoice.customer as string;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: 'past_due'
          }
        });
        break;
      }
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook event:', error);
    res.status(500).send(`Internal Webhook Handler Error`);
  }
}

// Map a Stripe Price ID to a plan key
function mapPriceToPlan(priceId: string): string {
  if (priceId === env.STRIPE_PRICE_STARTER_MONTHLY || priceId === env.STRIPE_PRICE_STARTER_YEARLY) {
    return 'starter';
  }
  if (priceId === env.STRIPE_PRICE_PRO_MONTHLY || priceId === env.STRIPE_PRICE_PRO_YEARLY) {
    return 'pro';
  }
  if (priceId === env.STRIPE_PRICE_BUSINESS_MONTHLY || priceId === env.STRIPE_PRICE_BUSINESS_YEARLY) {
    return 'business';
  }
  return 'free';
}

// Synchronize customer subscription in the database
async function syncSubscription(customerId: string, subscription: any) {
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? mapPriceToPlan(priceId) : 'free';
  const status = subscription.status;
  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Retrieve limits
  const limits = getPlanLimits(plan);

  console.log(`Syncing subscription for Stripe Customer: ${customerId}. Plan: ${plan}, Status: ${status}, Limits:`, limits);

  // Update user subscriptions
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: plan,
      subscriptionStatus: status,
      subscriptionCurrentPeriodEnd: periodEnd,
      credits: limits.monthlyGenerations, // Reset user credits to the plan allotment
    },
  });
}

// Cancel user subscription in the database
async function cancelSubscription(customerId: string) {
  console.log(`Cancelling subscription for Stripe Customer: ${customerId}`);
  const freeLimits = getPlanLimits('free');

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: null,
      subscriptionPlan: 'free',
      subscriptionStatus: 'canceled',
      subscriptionCurrentPeriodEnd: null,
      credits: freeLimits.monthlyGenerations, // Set back to free allotment
    },
  });
}
