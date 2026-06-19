'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  text: string
  title?: string
}

export default function CopyButton({ text, title }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title ?? text}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground
                 hover:bg-muted hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check size={12} className="text-green-600" />
      ) : (
        <Copy size={12} />
      )}
      {copied ? 'Copiado' : 'Copiar link'}
    </button>
  )
}
