import { describe, it, expect } from 'vitest';
import { parseAmd, AMD_CONTENT_MAX_LENGTH } from '../amd.parser';

const VALID = `---
name: Promo Black Friday
description: Sait générer des flyers promo agressifs
tags:
  - promo
  - retail
version: 1
---

# Contexte
Règles : titres courts, CTA fort.`;

describe('parseAmd', () => {
  it('parses a valid .amd payload', () => {
    const result = parseAmd(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      name: 'Promo Black Friday',
      description: 'Sait générer des flyers promo agressifs',
      tags: ['promo', 'retail'],
      version: '1',
    });
    expect(result.value.content).toContain('Règles');
  });

  it('rejects payload without frontmatter', () => {
    const result = parseAmd('# Just markdown\nno frontmatter at all.');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('MISSING_FRONTMATTER');
  });

  it('rejects payload missing name', () => {
    const raw = `---\ndescription: nope\n---\n\nbody`;
    const result = parseAmd(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('MISSING_NAME');
  });

  it('rejects tags that is not an array', () => {
    const raw = `---\nname: x\ntags: not-an-array\n---\n\nbody`;
    const result = parseAmd(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_TAGS');
  });

  it('rejects malformed YAML frontmatter', () => {
    const raw = `---\nname: x\ntags: [unterminated\n---\n\nbody`;
    const result = parseAmd(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(['YAML_PARSE', 'INVALID_TAGS']).toContain(result.error.code);
  });

  it('rejects body that exceeds AMD_CONTENT_MAX_LENGTH', () => {
    const oversized = 'x'.repeat(AMD_CONTENT_MAX_LENGTH + 10);
    const raw = `---\nname: big\ntags: []\n---\n\n${oversized}`;
    const result = parseAmd(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('CONTENT_TOO_LONG');
  });

  it('defaults tags to empty array when absent', () => {
    const raw = `---\nname: x\n---\n\nbody`;
    const result = parseAmd(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tags).toEqual([]);
  });
});
