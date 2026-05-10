'use client'

import { useMemo, useState } from 'react'
import { Trash2, Network } from 'lucide-react'
import { AgentDefinition, AgentMemoryLink, AgentMemoryUsageType } from '@/types/agent'
import { MemoryDefinition } from '@/types/memory'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_W = 200
const NODE_H = 44
const GAP = 16
const PAD_TOP = 32
const COL_LEFT = 80          // x of left edge of agent cards
const COL_RIGHT = 720         // x of left edge of memory cards
const SVG_W = 1000

// usageType colors are constants (encode meaning, must stay stable in dark mode)
const USAGE_COLORS: Record<AgentMemoryUsageType, string> = {
  INPUT:  '#3B82F6',
  OUTPUT: '#7C3AED',
  BOTH:   '#10B981',
}

const USAGE_TYPE_STYLE: Record<AgentMemoryUsageType, string> = {
  INPUT:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OUTPUT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  BOTH:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ─── Component ────────────────────────────────────────────────────────────────
interface GlobalLinkGraphProps {
  agents: AgentDefinition[]
  memories: MemoryDefinition[]
  links: AgentMemoryLink[]
  onDeleteLink: (linkId: string) => void
}

export function GlobalLinkGraph({ agents, memories, links, onDeleteLink }: GlobalLinkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<{ kind: 'agent' | 'memory'; id: string } | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  // Active usage-type filters — all on by default, click a legend pill to toggle
  const [filters, setFilters] = useState<Record<AgentMemoryUsageType, boolean>>({
    INPUT: true,
    OUTPUT: true,
    BOTH: true,
  })

  function toggleFilter(u: AgentMemoryUsageType) {
    setFilters((f) => ({ ...f, [u]: !f[u] }))
    // Clear selection if it would no longer be visible
    if (selectedLinkId) {
      const sel = links.find((l) => l.id === selectedLinkId)
      if (sel && sel.usageType === u && filters[u]) setSelectedLinkId(null)
    }
  }

  // Index agents/memories by id for O(1) lookup
  const agentById  = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents])
  const memoryById = useMemo(() => new Map(memories.map((m) => [m.id, m])), [memories])

  // Resolve link → resolved agent + memory (filter out orphans defensively).
  // Also respects the usageType filters.
  const resolvedLinks = useMemo(
    () =>
      links
        .filter((l) => filters[l.usageType])
        .map((l) => ({
          link: l,
          agent: agentById.get(l.agentDefinitionId),
          memory: memoryById.get(l.memoryDefinitionId),
        }))
        .filter((r): r is { link: AgentMemoryLink; agent: AgentDefinition; memory: MemoryDefinition } =>
          Boolean(r.agent && r.memory),
        ),
    [links, agentById, memoryById, filters],
  )

  // Counts per usageType (computed on full list — filter pills always show real totals)
  const countsByUsage = useMemo(() => {
    const c: Record<AgentMemoryUsageType, number> = { INPUT: 0, OUTPUT: 0, BOTH: 0 }
    for (const l of links) c[l.usageType]++
    return c
  }, [links])

  // Y position helpers
  const agentIndex  = useMemo(() => new Map(agents.map((a, i) => [a.id, i])), [agents])
  const memoryIndex = useMemo(() => new Map(memories.map((m, i) => [m.id, i])), [memories])

  const yOf = (i: number) => PAD_TOP + i * (NODE_H + GAP) + NODE_H / 2

  const SVG_H = PAD_TOP * 2 + Math.max(agents.length, memories.length, 1) * (NODE_H + GAP)

  // Determine if an edge should stay opaque given the current hover
  function isEdgeActive(link: AgentMemoryLink): boolean {
    if (!hoveredNode) return true
    if (hoveredNode.kind === 'agent')  return link.agentDefinitionId  === hoveredNode.id
    if (hoveredNode.kind === 'memory') return link.memoryDefinitionId === hoveredNode.id
    return true
  }

  // Determine if a node should be highlighted (hovered OR incident to selected link)
  function isNodeHighlighted(kind: 'agent' | 'memory', id: string): boolean {
    if (hoveredNode?.kind === kind && hoveredNode.id === id) return true
    if (selectedLinkId) {
      const sel = resolvedLinks.find((r) => r.link.id === selectedLinkId)
      if (sel) {
        if (kind === 'agent'  && sel.link.agentDefinitionId  === id) return true
        if (kind === 'memory' && sel.link.memoryDefinitionId === id) return true
      }
    }
    return false
  }

  const selected = selectedLinkId
    ? resolvedLinks.find((r) => r.link.id === selectedLinkId)
    : null

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (agents.length === 0 || memories.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-10 text-center">
        <Network className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
        <p className="text-sm text-[var(--text-muted)]">Pas assez de données pour afficher le graphe</p>
        <p className="text-xs text-[var(--text-subtle)] mt-1">Créez des agents et des mémoires pour voir leurs liaisons</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 relative">
      {/* Header with title + legend */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Réseau global Agents ↔ Mémoires</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {agents.length} agents · {memories.length} mémoires · {resolvedLinks.length}
            {resolvedLinks.length !== links.length && (
              <span className="text-[var(--text-subtle)]">/{links.length}</span>
            )} liaisons
          </p>
        </div>

        {/* Legend / Filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)]">
          {(['INPUT', 'OUTPUT', 'BOTH'] as AgentMemoryUsageType[]).map((u) => {
            const active = filters[u]
            return (
              <button
                key={u}
                type="button"
                onClick={() => toggleFilter(u)}
                title={active ? `Masquer ${u}` : `Afficher ${u}`}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                  active
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)] opacity-60'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-opacity"
                  style={{
                    backgroundColor: USAGE_COLORS[u],
                    opacity: active ? 1 : 0.35,
                  }}
                />
                <span>{u}</span>
                <span className={cn('text-[9px] tabular-nums', active ? 'text-[var(--text-muted)]' : 'text-[var(--text-subtle)]')}>
                  {countsByUsage[u]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SVG diagram */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minHeight: SVG_H, maxHeight: '70vh' }}
        >
          <defs>
            {(['INPUT', 'OUTPUT', 'BOTH'] as AgentMemoryUsageType[]).map((u) => (
              <marker
                key={u}
                id={`arrow-${u}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={USAGE_COLORS[u]} />
              </marker>
            ))}
          </defs>

          {/* Column headers */}
          <text x={COL_LEFT + NODE_W / 2} y={20} textAnchor="middle" className="fill-[var(--text-muted)]" style={{ fontSize: 11, fontWeight: 600 }}>
            AGENTS
          </text>
          <text x={COL_RIGHT + NODE_W / 2} y={20} textAnchor="middle" className="fill-[var(--text-muted)]" style={{ fontSize: 11, fontWeight: 600 }}>
            MÉMOIRES
          </text>

          {/* Edges layer */}
          <g>
            {resolvedLinks.map(({ link, agent, memory }) => {
              const ai = agentIndex.get(agent.id)!
              const mi = memoryIndex.get(memory.id)!
              const x1 = COL_LEFT + NODE_W
              const y1 = yOf(ai)
              const x2 = COL_RIGHT
              const y2 = yOf(mi)
              const cx1 = x1 + 180
              const cx2 = x2 - 180
              const d = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`

              const color = USAGE_COLORS[link.usageType]
              const isActive = isEdgeActive(link)
              const isSelected = selectedLinkId === link.id
              const opacity = isActive ? (selectedLinkId && !isSelected ? 0.4 : 1) : 0.15

              return (
                <g key={link.id} className="transition-opacity duration-150" style={{ opacity }}>
                  {/* Visible path */}
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    markerEnd={`url(#arrow-${link.usageType})`}
                  />
                  {/* Invisible hit area (wider) for easier click */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={12}
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onClick={() => setSelectedLinkId(link.id)}
                  />
                </g>
              )
            })}
          </g>

          {/* Agent nodes (left column) */}
          <g>
            {agents.map((agent, i) => {
              const y = yOf(i) - NODE_H / 2
              const highlighted = isNodeHighlighted('agent', agent.id)
              return (
                <g
                  key={agent.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNode({ kind: 'agent', id: agent.id })}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <rect
                    x={COL_LEFT}
                    y={y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill="var(--surface)"
                    stroke={highlighted ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={highlighted ? 2 : 1}
                    className="transition-all duration-150"
                  />
                  <text
                    x={COL_LEFT + 12}
                    y={y + 18}
                    style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700, fill: 'var(--accent)' }}
                  >
                    {truncate(agent.key, 22)}
                  </text>
                  <text
                    x={COL_LEFT + 12}
                    y={y + 34}
                    style={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  >
                    {truncate(agent.name, 26)}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Memory nodes (right column) */}
          <g>
            {memories.map((memory, i) => {
              const y = yOf(i) - NODE_H / 2
              const highlighted = isNodeHighlighted('memory', memory.id)
              return (
                <g
                  key={memory.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNode({ kind: 'memory', id: memory.id })}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <rect
                    x={COL_RIGHT}
                    y={y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill="var(--surface)"
                    stroke={highlighted ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={highlighted ? 2 : 1}
                    className="transition-all duration-150"
                  />
                  <text
                    x={COL_RIGHT + 12}
                    y={y + 18}
                    style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700, fill: 'var(--accent)' }}
                  >
                    {truncate(memory.key, 22)}
                  </text>
                  <text
                    x={COL_RIGHT + 12}
                    y={y + 34}
                    style={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  >
                    {truncate(memory.name, 26)}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Detail panel — visible when an edge is selected */}
      {selected && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between gap-3 animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0', USAGE_TYPE_STYLE[selected.link.usageType])}>
              {selected.link.usageType}
            </span>
            <div className="min-w-0">
              <div className="text-xs text-[var(--text)] truncate">
                <span className="font-semibold">{selected.agent.name}</span>
                <span className="text-[var(--text-subtle)] mx-1.5">→</span>
                <code className="font-mono text-[var(--accent)]">{selected.memory.key}</code>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Priorité {selected.link.priority}
                {selected.link.isRequired && <span className="text-red-500 ml-2">requis</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedLinkId(null)}
              className="px-2 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => { onDeleteLink(selected.link.id); setSelectedLinkId(null) }}
              className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
              title="Supprimer la liaison"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
