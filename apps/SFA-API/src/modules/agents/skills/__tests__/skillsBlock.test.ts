import { describe, it, expect } from 'vitest';
import { buildSkillsBlock } from '../skillsBlock.util';

describe('buildSkillsBlock', () => {
  it('returns empty string when no skill is provided', () => {
    expect(buildSkillsBlock([])).toBe('');
    expect(buildSkillsBlock(null)).toBe('');
    expect(buildSkillsBlock(undefined)).toBe('');
  });

  it('omits inactive skills', () => {
    const output = buildSkillsBlock([
      { name: 'A', description: 'd', content: 'a', isActive: false },
      { name: 'B', description: 'd', content: 'b', isActive: true },
    ]);
    expect(output).toContain('### Skill: B');
    expect(output).not.toContain('### Skill: A');
  });

  it('renders the canonical SKILLS DISPONIBLES block', () => {
    const output = buildSkillsBlock([
      { name: 'Promo', description: 'Promo aggressive', content: 'Titres courts', isActive: true },
      { name: 'Lux', description: null, content: 'Tons sobres', isActive: true },
    ]);
    expect(output.startsWith('## SKILLS DISPONIBLES')).toBe(true);
    expect(output).toContain('### Skill: Promo');
    expect(output).toContain('Promo aggressive');
    expect(output).toContain('Titres courts');
    expect(output).toContain('### Skill: Lux');
    expect(output).toContain('Tons sobres');
    expect(output).toMatch(/---/);
  });

  it('returns empty string when every skill is inactive', () => {
    const output = buildSkillsBlock([
      { name: 'A', description: 'd', content: 'a', isActive: false },
      { name: 'B', description: 'd', content: 'b', isActive: false },
    ]);
    expect(output).toBe('');
  });
});
