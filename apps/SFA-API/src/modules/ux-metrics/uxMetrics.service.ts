import { Prisma, UxMetricEventType } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateUxMetricEventInput } from './uxMetrics.validation';

const SUMMARY_WINDOW_DAYS = 30;

export const uxMetricsService = {
  createEvent: async (userId: string, input: CreateUxMetricEventInput) => {
    return prisma.uxMetricEvent.create({
      data: {
        userId,
        eventType: input.eventType as UxMetricEventType,
        path: input.path,
        fromPath: input.fromPath ?? undefined,
        toPath: input.toPath ?? undefined,
        durationMs: input.durationMs ?? undefined,
        satisfactionScore: input.satisfactionScore ?? undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });
  },

  getSummary: async (userId: string) => {
    const since = new Date(Date.now() - SUMMARY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const baseWhere = { userId, createdAt: { gte: since } };

    const [
      totalEvents,
      navigationAgg,
      satisfactionAgg,
      navigationErrorCount,
      exportCount,
      recentEvents,
      recentPageViews
    ] = await prisma.$transaction([
      prisma.uxMetricEvent.count({ where: baseWhere }),
      prisma.uxMetricEvent.aggregate({
        where: {
          ...baseWhere,
          eventType: 'NAVIGATION',
          durationMs: { not: null }
        },
        _avg: { durationMs: true },
        _count: { _all: true }
      }),
      prisma.uxMetricEvent.aggregate({
        where: {
          ...baseWhere,
          eventType: 'SATISFACTION',
          satisfactionScore: { not: null }
        },
        _avg: { satisfactionScore: true },
        _count: { _all: true }
      }),
      prisma.uxMetricEvent.count({
        where: {
          ...baseWhere,
          eventType: 'NAVIGATION_ERROR'
        }
      }),
      prisma.uxMetricEvent.count({
        where: {
          ...baseWhere,
          metadata: {
            path: ['name'],
            equals: 'export_clicked'
          }
        }
      }),
      prisma.uxMetricEvent.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          eventType: true,
          path: true,
          fromPath: true,
          toPath: true,
          durationMs: true,
          satisfactionScore: true,
          createdAt: true
        }
      }),
      prisma.uxMetricEvent.findMany({
        where: {
          ...baseWhere,
          eventType: 'PAGE_VIEW'
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: { path: true }
      })
    ]);

    const routeMap = recentPageViews.reduce<Record<string, number>>((acc, event) => {
      acc[event.path] = (acc[event.path] ?? 0) + 1;
      return acc;
    }, {});

    const routeBreakdown = Object.entries(routeMap)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const averageNavigationMs = navigationAgg._avg.durationMs
      ? Math.round(navigationAgg._avg.durationMs)
      : null;
    const satisfactionAverage = satisfactionAgg._avg.satisfactionScore
      ? Number(satisfactionAgg._avg.satisfactionScore.toFixed(2))
      : null;

    return {
      windowDays: SUMMARY_WINDOW_DAYS,
      totalEvents,
      navigationCount: navigationAgg._count._all,
      averageNavigationMs,
      satisfactionCount: satisfactionAgg._count._all,
      satisfactionAverage,
      satisfactionRate: satisfactionAverage ? Math.round((satisfactionAverage / 5) * 100) : null,
      navigationErrorCount,
      exportCount,
      routeBreakdown,
      recentEvents,
      generatedAt: new Date().toISOString()
    };
  }
};
