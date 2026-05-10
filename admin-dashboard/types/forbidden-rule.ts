export type ForbiddenRuleCategory =
  | 'TYPOGRAPHY'
  | 'COLORS'
  | 'COMPOSITION'
  | 'LOGO'
  | 'IMAGE_QUALITY'
  | 'TEXT_CONTENT'
  | 'BRAND_IDENTITY'
  | 'CONTACT_INFO'
  | 'EFFECTS'
  | 'TEXTURES'
  | 'SOCIAL_MEDIA'
  | 'PRINT'
  | 'AI_GENERATION'
  | 'LEGAL_SECURITY'
  | 'OTHER'

export type ForbiddenRuleSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ForbiddenRuleScope = 'GLOBAL' | 'CATEGORY' | 'STYLE' | 'PROJECT_TYPE'

export interface ForbiddenRule {
  id: string
  key: string
  title: string
  description: string | null
  category: ForbiddenRuleCategory
  severity: ForbiddenRuleSeverity
  scope: ForbiddenRuleScope
  appliesTo: unknown | null
  examples: string[] | null
  correctionTips: string[] | null
  negativePrompt: string | null
  isSystem: boolean
  isActive: boolean
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface ForbiddenRulesPaginated {
  items: ForbiddenRule[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ForbiddenRulesFilters {
  q?: string
  category?: ForbiddenRuleCategory | ''
  severity?: ForbiddenRuleSeverity | ''
  scope?: ForbiddenRuleScope | ''
  isActive?: 'true' | 'false' | ''
  page?: number
  limit?: number
}

export const FORBIDDEN_RULE_CATEGORIES: ForbiddenRuleCategory[] = [
  'TYPOGRAPHY', 'COLORS', 'COMPOSITION', 'LOGO', 'IMAGE_QUALITY',
  'TEXT_CONTENT', 'BRAND_IDENTITY', 'CONTACT_INFO', 'EFFECTS', 'TEXTURES',
  'SOCIAL_MEDIA', 'PRINT', 'AI_GENERATION', 'LEGAL_SECURITY', 'OTHER',
]

export const FORBIDDEN_RULE_SEVERITIES: ForbiddenRuleSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
export const FORBIDDEN_RULE_SCOPES: ForbiddenRuleScope[] = ['GLOBAL', 'CATEGORY', 'STYLE', 'PROJECT_TYPE']
