'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, FileUp, X } from 'lucide-react'
import { parseAmdClient, AMD_CONTENT_MAX_LENGTH } from '@/lib/amd'
import { toastError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export interface SkillsEditorEntry {
  id?: string
  name: string
  description?: string | null
  tags: string[]
  content: string
  isActive: boolean
  order: number
}

interface SkillsEditorProps<T extends SkillsEditorEntry> {
  skills: T[]
  onChange: (next: T[]) => void
  /** Generate a fresh skill row when the user clicks "Ajouter" */
  newEntry: () => T
}

const CONTENT_WARN_THRESHOLD = 18_000

export function SkillsEditor<T extends SkillsEditorEntry>({
  skills,
  onChange,
  newEntry,
}: SkillsEditorProps<T>) {
  function addSkill() {
    onChange([...skills, { ...newEntry(), order: skills.length } as T])
  }

  function removeSkill(index: number) {
    const next = skills.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    onChange(next)
  }

  function move(index: number, delta: -1 | 1) {
    const swapIndex = index + delta
    if (swapIndex < 0 || swapIndex >= skills.length) return
    const next = [...skills]
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    onChange(next.map((s, i) => ({ ...s, order: i })))
  }

  function patch(index: number, partial: Partial<SkillsEditorEntry>) {
    const next = skills.map((s, i) => (i === index ? ({ ...s, ...partial } as T) : s))
    onChange(next)
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Compétences (.amd)
          </div>
          <div className="text-[11px] text-[var(--text-subtle)]">
            Injectées dans le contexte de l'agent au moment où il traite une demande. Glisser-déposer
            un fichier <code className="font-mono">.amd</code> sur une compétence pour pré-remplir.
          </div>
        </div>
        <button
          type="button"
          onClick={addSkill}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg-subtle)]"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-6 text-center text-xs text-[var(--text-subtle)]">
          Aucune compétence. Cliquer sur « Ajouter » ou glisser un fichier <code>.amd</code>.
        </div>
      ) : (
        <ul className="space-y-2">
          {skills.map((skill, index) => (
            <SkillRow
              key={skill.id ?? index}
              skill={skill}
              isFirst={index === 0}
              isLast={index === skills.length - 1}
              onPatch={(partial) => patch(index, partial)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onRemove={() => removeSkill(index)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface SkillRowProps {
  skill: SkillsEditorEntry
  isFirst: boolean
  isLast: boolean
  onPatch: (partial: Partial<SkillsEditorEntry>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

function SkillRow({ skill, isFirst, isLast, onPatch, onMoveUp, onMoveDown, onRemove }: SkillRowProps) {
  const [tagDraft, setTagDraft] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const overLimit = skill.content.length > AMD_CONTENT_MAX_LENGTH
  const nearLimit = skill.content.length > CONTENT_WARN_THRESHOLD

  function commitTag() {
    const trimmed = tagDraft.trim()
    if (!trimmed) return
    if (skill.tags.includes(trimmed)) {
      setTagDraft('')
      return
    }
    onPatch({ tags: [...skill.tags, trimmed] })
    setTagDraft('')
  }

  function removeTag(tag: string) {
    onPatch({ tags: skill.tags.filter((t) => t !== tag) })
  }

  async function handleFile(file: File) {
    try {
      const raw = await file.text()
      const result = parseAmdClient(raw)
      if (!result.ok) {
        toastError(`Fichier .amd invalide : ${result.error}`)
        return
      }
      onPatch({
        name: result.value.name,
        description: result.value.description ?? skill.description ?? '',
        tags: result.value.tags.length > 0 ? result.value.tags : skill.tags,
        content: result.value.content,
      })
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Lecture du fichier impossible.')
    }
  }

  return (
    <li
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) void handleFile(file)
      }}
      className={cn(
        'rounded-lg border bg-[var(--bg)] p-3 transition-colors',
        isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]',
        !skill.isActive && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={skill.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            placeholder="Nom de la compétence"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <input
            value={skill.description ?? ''}
            onChange={(e) => onPatch({ description: e.target.value })}
            placeholder="Description courte (visible dans le bloc SKILLS injecté)"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Monter"
            className="rounded-md border border-[var(--border)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Descendre"
            className="rounded-md border border-[var(--border)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => onPatch({ isActive: !skill.isActive })}
            title={skill.isActive ? 'Désactiver' : 'Activer'}
            aria-pressed={skill.isActive}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              skill.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
                skill.isActive ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Supprimer"
            className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500"
                title="Retirer le tag"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                commitTag()
              }
            }}
            onBlur={commitTag}
            placeholder="Tag…"
            className="min-w-[100px] flex-1 border-none bg-transparent px-1 text-[11px] text-[var(--text)] outline-none"
          />
        </div>
      </div>

      <details className="mt-2.5" open>
        <summary className="cursor-pointer text-[11px] font-medium text-[var(--text-muted)]">
          Contenu (.amd)
        </summary>
        <textarea
          value={skill.content}
          onChange={(e) => onPatch({ content: e.target.value })}
          rows={8}
          placeholder="Markdown injecté dans le contexte de l'agent."
          className={cn(
            'mt-1.5 w-full resize-y rounded-md border bg-[var(--surface)] px-2.5 py-2 font-mono text-[11px] leading-5 text-[var(--text)] outline-none',
            overLimit ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]',
          )}
        />
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className={cn(
            'tabular-nums',
            overLimit ? 'text-red-500 font-semibold' : nearLimit ? 'text-amber-600' : 'text-[var(--text-subtle)]',
          )}>
            {skill.content.length.toLocaleString('fr-FR')} / {AMD_CONTENT_MAX_LENGTH.toLocaleString('fr-FR')} caractères
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 text-[var(--text-subtle)] hover:text-[var(--accent)]"
          >
            <FileUp className="h-3 w-3" /> Importer un .amd
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".amd,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </details>
    </li>
  )
}
