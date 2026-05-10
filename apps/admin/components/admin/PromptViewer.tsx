'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptViewerProps {
  finalPrompt: string
  negativePrompt?: string
  className?: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

export function PromptViewer({ finalPrompt, negativePrompt, className }: PromptViewerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-xl overflow-hidden border border-violet-800/30">
        <div className="flex items-center justify-between px-3 py-2 bg-[#1E1B4B]">
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Prompt Final</span>
          <CopyButton text={finalPrompt} />
        </div>
        <pre className="px-4 py-3 bg-[#0F0B3D] text-violet-100 text-xs leading-relaxed whitespace-pre-wrap break-words font-mono">
          {finalPrompt}
        </pre>
      </div>

      {negativePrompt && (
        <div className="rounded-xl overflow-hidden border border-red-800/30">
          <div className="flex items-center justify-between px-3 py-2 bg-[#2D1212]">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Prompt Négatif</span>
            <CopyButton text={negativePrompt} />
          </div>
          <pre className="px-4 py-3 bg-[#1A0A0A] text-red-200 text-xs leading-relaxed whitespace-pre-wrap break-words font-mono">
            {negativePrompt}
          </pre>
        </div>
      )}
    </div>
  )
}
