import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';

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
};
