import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { stripe } from '../../config/stripe';

const SUBSCRIPTION_PLAN_DEFAULTS = {
  free:     { name: 'Gratuit',  price: 0,  currency: 'XOF', credits: 0,   maxProjects: 3,   maxFilesPerProject: 3,  features: ['3 projets max', '3 générations gratuites', 'Affiches en basse résolution'], isActive: true },
  starter:  { name: 'Starter',  price: 9,  currency: 'EUR', credits: 50,  maxProjects: 10,  maxFilesPerProject: 10, features: ['10 projets', '50 crédits/mois', 'HD 1080p', 'Support email'], isActive: true },
  business: { name: 'Business', price: 29, currency: 'EUR', credits: 200, maxProjects: 50,  maxFilesPerProject: 20, features: ['50 projets', '200 crédits/mois', '4K', 'Support prioritaire', 'Export multi-formats'], isActive: true },
  agence:   { name: 'Agence',   price: 79, currency: 'EUR', credits: 500, maxProjects: 999, maxFilesPerProject: 50, features: ['Projets illimités', '500 crédits/mois', '4K + RAW', 'Account manager dédié', 'API access', 'White-label'], isActive: true },
};

export const adminService = {
  // Memory Definitions
  createMemoryDef: async (data: Prisma.MemoryDefinitionCreateInput) => {
    return prisma.memoryDefinition.create({ data });
  },
  listMemoryDefs: async () => {
    return prisma.memoryDefinition.findMany({
      include: { _count: { select: { entries: true, agentLinks: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },
  getMemoryDef: async (id: string) => {
    const def = await prisma.memoryDefinition.findUnique({ where: { id } });
    if (!def) throw new AppError('MemoryDefinition not found', 404);
    return def;
  },
  updateMemoryDef: async (id: string, data: Prisma.MemoryDefinitionUpdateInput) => {
    return prisma.memoryDefinition.update({ where: { id }, data });
  },
  deleteMemoryDef: async (id: string) => {
    const def = await prisma.memoryDefinition.findUnique({ where: { id } });
    if (!def) throw new AppError('MemoryDefinition not found', 404);
    if (def.isSystem) throw new AppError('Cannot delete a system MemoryDefinition', 400);
    return prisma.memoryDefinition.delete({ where: { id } });
  },

  // Agent Definitions
  createAgentDef: async (data: Prisma.AgentDefinitionCreateInput) => {
    return prisma.agentDefinition.create({ data });
  },
  listAgentDefs: async () => {
    return prisma.agentDefinition.findMany({
      include: { _count: { select: { memoryLinks: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },
  getAgentDef: async (id: string) => {
    const def = await prisma.agentDefinition.findUnique({
      where: { id },
      include: { memoryLinks: { include: { memory: true } } }
    });
    if (!def) throw new AppError('AgentDefinition not found', 404);
    return def;
  },
  updateAgentDef: async (id: string, data: Prisma.AgentDefinitionUpdateInput) => {
    return prisma.agentDefinition.update({ where: { id }, data });
  },
  deleteAgentDef: async (id: string) => {
    return prisma.agentDefinition.delete({ where: { id } });
  },

  // Agent Memory Links
  createAgentMemoryLink: async (data: Prisma.AgentMemoryLinkUncheckedCreateInput) => {
    return prisma.agentMemoryLink.create({ data });
  },
  listAgentMemoryLinks: async () => {
    return prisma.agentMemoryLink.findMany({
      include: { agent: true, memory: true }
    });
  },
  getAgentMemoryLinksByAgent: async (agentId: string) => {
    return prisma.agentMemoryLink.findMany({
      where: { agentDefinitionId: agentId },
      include: { memory: true }
    });
  },
  updateAgentMemoryLink: async (id: string, data: Prisma.AgentMemoryLinkUpdateInput) => {
    return prisma.agentMemoryLink.update({ where: { id }, data });
  },
  deleteAgentMemoryLink: async (id: string) => {
    return prisma.agentMemoryLink.delete({ where: { id } });
  },

  // ─── Admin overview ────────────────────────────────────────────────────────

  getStats: async () => {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      postersGenerated,
      agentRunsSuccess,
      agentRunsFailed,
      creditSum,
      totalPayments,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.project.count(),
      prisma.generatedPoster.count({ where: { status: 'GENERATED' } }),
      prisma.agentRun.count({ where: { status: 'SUCCESS' } }),
      prisma.agentRun.count({ where: { status: 'FAILED' } }),
      prisma.creditTransaction.aggregate({ _sum: { amount: true }, where: { amount: { lt: 0 } } }),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
    ]);

    const totalRuns = agentRunsSuccess + agentRunsFailed;
    const aiFailureRate = totalRuns > 0 ? Math.round((agentRunsFailed / totalRuns) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      totalProjects,
      promptsGenerated: agentRunsSuccess,
      postersGenerated,
      creditsConsumed: Math.abs(creditSum._sum.amount ?? 0),
      monthlyRevenue: revenueResult._sum.amount ?? 0,
      successfulPayments: totalPayments,
      aiFailureRate,
      activeAgents: await prisma.agentDefinition.count({ where: { isActive: true } }),
    };
  },

  // ─── Users ─────────────────────────────────────────────────────────────────

  listUsers: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  adjustCredits: async (userId: string, amount: number, reason?: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
        select: { id: true, fullName: true, email: true, credits: true },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          type: amount > 0 ? 'ADD' : 'REMOVE',
          amount,
          balanceAfter: user.credits + amount,
          reason: reason ?? null,
        },
      }),
    ]);

    return updatedUser;
  },

  // ─── Projects ──────────────────────────────────────────────────────────────

  listProjects: async () => {
    return prisma.project.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { generatedPosters: true, files: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Generated Posters ─────────────────────────────────────────────────────

  listPosters: async () => {
    return prisma.generatedPoster.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Files ─────────────────────────────────────────────────────────────────

  listFiles: async () => {
    return prisma.fileAsset.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Agent Runs (global) ───────────────────────────────────────────────────

  listAgentRuns: async () => {
    return prisma.agentRun.findMany({
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },

  // ─── Prompts (M-PROMPT1 MemoryEntries) ────────────────────────────────────

  listPrompts: async () => {
    return prisma.memoryEntry.findMany({
      where: {
        memoryDefinition: { key: 'M-PROMPT1' },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, title: true } },
        memoryDefinition: { select: { key: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Payments ──────────────────────────────────────────────────────────────

  listPayments: async () => {
    return prisma.payment.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Credit Transactions ───────────────────────────────────────────────────

  listCreditTransactions: async () => {
    return prisma.creditTransaction.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Delete operations ─────────────────────────────────────────────────────

  deleteUser: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    return prisma.user.delete({ where: { id } });
  },

  deleteProject: async (id: string) => {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError('Project not found', 404);
    return prisma.project.delete({ where: { id } });
  },

  deleteFile: async (id: string) => {
    const file = await prisma.fileAsset.findUnique({ where: { id } });
    if (!file) throw new AppError('File not found', 404);
    return prisma.fileAsset.delete({ where: { id } });
  },

  deletePoster: async (id: string) => {
    const poster = await prisma.generatedPoster.findUnique({ where: { id } });
    if (!poster) throw new AppError('Poster not found', 404);
    return prisma.generatedPoster.delete({ where: { id } });
  },

  updatePoster: async (id: string, data: { isExample?: boolean }) => {
    return prisma.generatedPoster.update({ where: { id }, data });
  },

  // ─── Chart Data (30 derniers jours) ────────────────────────────────────────

  getChartData: async () => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [users, runs, payments] = await Promise.all([
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.agentRun.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.payment.findMany({
        where: { createdAt: { gte: since }, status: 'SUCCESS' },
        select: { createdAt: true, amount: true },
      }),
    ]);

    // Build 30-day buckets
    const days: Record<string, { date: string; users: number; generations: number; revenue: number; prompts: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key.slice(5), users: 0, generations: 0, revenue: 0, prompts: 0 };
    }

    users.forEach((u) => {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (days[key]) days[key].users++;
    });

    runs.forEach((r) => {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (days[key]) { days[key].generations++; days[key].prompts++; }
    });

    payments.forEach((p) => {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (days[key]) days[key].revenue += p.amount;
    });

    return Object.values(days);
  },

  getUxMetricsSummary: async () => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalEvents,
      activeMetricUsers,
      satisfactionAgg,
      navigationErrors,
      recentEvents,
    ] = await Promise.all([
      prisma.uxMetricEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.uxMetricEvent.findMany({
        where: { createdAt: { gte: since } },
        distinct: ['userId'],
        select: { userId: true }
      }),
      prisma.uxMetricEvent.aggregate({
        where: {
          createdAt: { gte: since },
          eventType: 'SATISFACTION',
          satisfactionScore: { not: null }
        },
        _avg: { satisfactionScore: true },
        _count: { _all: true }
      }),
      prisma.uxMetricEvent.count({
        where: {
          createdAt: { gte: since },
          eventType: 'NAVIGATION_ERROR'
        }
      }),
      prisma.uxMetricEvent.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          userId: true,
          eventType: true,
          path: true,
          durationMs: true,
          satisfactionScore: true,
          createdAt: true
        }
      })
    ]);

    return {
      windowDays: 30,
      totalEvents,
      activeMetricUsers: activeMetricUsers.length,
      satisfactionAverage: satisfactionAgg._avg.satisfactionScore
        ? Number(satisfactionAgg._avg.satisfactionScore.toFixed(2))
        : null,
      satisfactionCount: satisfactionAgg._count._all,
      navigationErrors,
      recentEvents,
      generatedAt: new Date().toISOString()
    };
  },

  // ─── Payment Actions ───────────────────────────────────────────────────────

  refundPayment: async (paymentId: string) => {
    if (!stripe) throw new AppError('Stripe non configuré', 503);
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError('Paiement introuvable', 404);
    if (payment.status !== 'SUCCESS') throw new AppError('Seuls les paiements réussis peuvent être remboursés', 400);
    if (payment.provider !== 'STRIPE') throw new AppError('Remboursement uniquement disponible pour Stripe', 400);

    const invoice = await stripe.invoices.retrieve(payment.reference);
    if (!invoice.charge) throw new AppError('Aucun charge associé à ce paiement', 400);

    await stripe.refunds.create({ charge: invoice.charge as string });
    return prisma.payment.update({ where: { id: paymentId }, data: { status: 'CANCELLED' } });
  },

  verifyPayment: async (paymentId: string) => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError('Paiement introuvable', 404);
    if (payment.provider !== 'STRIPE' || !stripe) return payment;

    const invoice = await stripe.invoices.retrieve(payment.reference);
    const newStatus =
      invoice.status === 'paid'  ? 'SUCCESS'   :
      invoice.status === 'void'  ? 'CANCELLED'  :
      invoice.status === 'open'  ? 'PENDING'    : 'FAILED';

    if (newStatus !== payment.status) {
      return prisma.payment.update({ where: { id: paymentId }, data: { status: newStatus } });
    }
    return payment;
  },

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  listSubscriptions: async () => {
    const [counts, settings] = await Promise.all([
      prisma.user.groupBy({ by: ['subscriptionPlan'], _count: { _all: true } }),
      prisma.appSetting.findMany({ where: { category: 'subscriptions' } }),
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c.subscriptionPlan, c._count._all]));
    const findVal = (key: string) => settings.find(s => s.key === key)?.value;

    return Object.entries(SUBSCRIPTION_PLAN_DEFAULTS).map(([id, def]) => ({
      id,
      ...def,
      price:       findVal(`plan_${id}_price`)       !== undefined ? Number(findVal(`plan_${id}_price`))       : def.price,
      credits:     findVal(`plan_${id}_credits`)     !== undefined ? Number(findVal(`plan_${id}_credits`))     : def.credits,
      maxProjects: findVal(`plan_${id}_maxProjects`) !== undefined ? Number(findVal(`plan_${id}_maxProjects`)) : def.maxProjects,
      subscribersCount: countMap[id] ?? 0,
    }));
  },

  updateSubscription: async (planId: string, data: { price?: number; credits?: number; maxProjects?: number }) => {
    if (!SUBSCRIPTION_PLAN_DEFAULTS[planId as keyof typeof SUBSCRIPTION_PLAN_DEFAULTS])
      throw new AppError('Plan not found', 404);

    const upserts = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([field, value]) =>
        prisma.appSetting.upsert({
          where:  { key: `plan_${planId}_${field}` },
          update: { value: String(value) },
          create: { key: `plan_${planId}_${field}`, value: String(value), category: 'subscriptions', isSecret: false },
        })
      );
    if (upserts.length) await prisma.$transaction(upserts);

    const all = await adminService.listSubscriptions();
    return all.find(p => p.id === planId)!;
  },

  getLlmProviders: async () => {
    const allSettings = await prisma.appSetting.findMany({
      where: { category: 'providers' }
    });

    const findVal = (key: string) => allSettings.find(s => s.key === key)?.value ?? '';

    // Standard key existence checks (DB + ENV)
    const openaiKey = findVal('openai_api_key') || process.env.OPENAI_API_KEY || '';
    const anthropicKey = findVal('anthropic_api_key') || process.env.ANTHROPIC_API_KEY || '';
    const geminiKey = findVal('gemini_api_key') || process.env.GEMINI_API_KEY || '';

    const standardProviders = [
      {
        id: 'openai',
        name: 'OpenAI',
        slug: 'openai',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: findVal('openai_model') || 'gpt-4o',
        enabled: openaiKey.trim() !== '',
        supportsText: true,
        supportsVision: true,
        supportsReasoning: true,
        supportsImageGeneration: true
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        slug: 'anthropic',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        defaultModel: findVal('anthropic_model') || 'claude-3-5-sonnet-20241022',
        enabled: anthropicKey.trim() !== '',
        supportsText: true,
        supportsVision: true,
        supportsReasoning: false,
        supportsImageGeneration: false
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        slug: 'gemini',
        type: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: findVal('gemini_model') || 'gemini-2.0-flash',
        enabled: geminiKey.trim() !== '',
        supportsText: true,
        supportsVision: true,
        supportsReasoning: false,
        supportsImageGeneration: false
      },
      {
        id: 'mock',
        name: 'Mock (simulation)',
        slug: 'mock',
        type: 'mock',
        baseUrl: '',
        defaultModel: 'mock-model',
        enabled: true,
        supportsText: true,
        supportsVision: true,
        supportsReasoning: false,
        supportsImageGeneration: false
      }
    ];

    const customList = [];
    for (const s of allSettings) {
      const match = s.key.match(/^custom_(.+)_name$/);
      if (!match) continue;
      const slug = match[1];

      const name = s.value;
      const type = findVal(`custom_${slug}_type`) || 'openai-compatible';
      const baseUrl = findVal(`custom_${slug}_base_url`);
      const defaultModel = findVal(`custom_${slug}_default_model`);
      const enabled = findVal(`custom_${slug}_is_active`) === 'true';

      const supportsTextVal = findVal(`custom_${slug}_supports_text`);
      let supportsText = supportsTextVal === 'true' || supportsTextVal === ''; // default true
      let supportsVision = findVal(`custom_${slug}_supports_vision`) === 'true';
      let supportsReasoning = findVal(`custom_${slug}_supports_reasoning`) === 'true';
      let supportsImageGeneration = findVal(`custom_${slug}_supports_image_generation`) === 'true';

      // DeepSeek dynamic capabilities override
      if (slug.toLowerCase().includes('deepseek') || (defaultModel && defaultModel.toLowerCase().includes('deepseek'))) {
        supportsText = true;
        supportsVision = false;
        supportsImageGeneration = false;
        if (defaultModel && defaultModel.toLowerCase().includes('reasoner')) {
          supportsReasoning = true;
        }
      }

      customList.push({
        id: slug,
        name,
        slug,
        type,
        baseUrl,
        defaultModel,
        enabled,
        supportsText,
        supportsVision,
        supportsReasoning,
        supportsImageGeneration,
      });
    }

    return [...standardProviders, ...customList];
  }
};
