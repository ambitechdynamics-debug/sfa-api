export interface PlanLimit {
  monthlyGenerations: number;
  hdExport: boolean;
  watermark: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  free: {
    monthlyGenerations: 5,
    hdExport: false,
    watermark: true,
  },
  starter: {
    monthlyGenerations: 20,
    hdExport: true,
    watermark: false,
  },
  pro: {
    monthlyGenerations: 100,
    hdExport: true,
    watermark: false,
  },
  business: {
    monthlyGenerations: 1000,
    hdExport: true,
    watermark: false,
  },
};

export function getPlanLimits(plan: string): PlanLimit {
  return PLAN_LIMITS[plan.toLowerCase()] || PLAN_LIMITS.free;
}
