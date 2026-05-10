import type { ForbiddenRule, ForbiddenRuleCategory, ForbiddenRuleSeverity, ForbiddenRuleScope } from '@prisma/client';

export type { ForbiddenRule, ForbiddenRuleCategory, ForbiddenRuleSeverity, ForbiddenRuleScope };

/** Shape used by the M-INTERDITS memory content payload */
export interface ForbiddenRulesMemoryContent {
  forbidden_status: 'active' | 'inactive';
  source: 'database';
  rules: Array<{
    key: string;
    title: string;
    category: ForbiddenRuleCategory;
    severity: ForbiddenRuleSeverity;
    description: string | null;
    examples: unknown[];
    correctionTips: unknown[];
    negativePrompt: string | null;
  }>;
  negative_prompt_text: string;
  last_synced_at: string;
}
