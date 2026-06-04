export interface SkillForInjection {
  name: string;
  description?: string | null;
  content: string;
  isActive?: boolean;
}

/**
 * Build the `## SKILLS DISPONIBLES` markdown block injected into an agent's
 * system prompt at runtime. Returns an empty string when no active skill is
 * provided — caller can safely `filter(Boolean).join('\n\n')`.
 *
 * Shared between `dynamic-context.service.ts` (orchestrator agents) and
 * `chat.service.ts` (conversational agent) so both surfaces inject the
 * same shape.
 */
export function buildSkillsBlock(skills: ReadonlyArray<SkillForInjection> | null | undefined): string {
  if (!skills?.length) return '';

  const active = skills.filter((s) => s.isActive !== false);
  if (active.length === 0) return '';

  const body = active
    .map((skill) => {
      const description = skill.description?.trim() ?? '';
      return [
        `### Skill: ${skill.name}`,
        description,
        '',
        skill.content.trim(),
        '',
        '---',
      ].join('\n');
    })
    .join('\n\n');

  return `## SKILLS DISPONIBLES\n\n${body}`;
}
