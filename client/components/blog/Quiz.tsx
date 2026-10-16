'use client'

import React, { useState } from 'react'
import { Check, X, RotateCcw, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { decodeData } from '@/lib/blog/content'

interface QuizProps {
  question?: string
  /** URI-encoded JSON array of option strings. */
  options?: string
  answer?: string | number
  explanation?: string
}

export function Quiz({ question, options, answer, explanation }: QuizProps) {
  const choices = decodeData<string[]>(options, [])
  const correct = Number(answer ?? 0)
  const [picked, setPicked] = useState<number | null>(null)
  const done = picked !== null
  const right = picked === correct

  return (
    <div className="not-prose my-8 rounded-2xl border-2 border-border bg-card shadow-brutal overflow-hidden">
      <div className="flex items-start gap-3 border-b-2 border-border bg-primary px-5 py-4">
        <HelpCircle size={18} className="mt-0.5 shrink-0" />
        <p className="font-bold leading-snug text-primary-foreground">{question || 'Quick question'}</p>
      </div>
      <div className="space-y-2 p-4">
        {choices.map((choice, i) => {
          const isCorrect = i === correct
          const isPicked = i === picked
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => setPicked(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border-2 border-border px-4 py-3 text-left text-sm font-semibold transition-all',
                !done && 'bg-card shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal',
                done && isCorrect && 'bg-secondary text-secondary-foreground',
                done && isPicked && !isCorrect && 'bg-destructive text-destructive-foreground',
                done && !isCorrect && !isPicked && 'opacity-50',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-border bg-card text-xs font-black text-foreground">
                {done && isCorrect ? <Check size={14} /> : done && isPicked ? <X size={14} /> : String.fromCharCode(65 + i)}
              </span>
              {choice}
            </button>
          )
        })}
      </div>
      {done && (
        <div className="flex items-start justify-between gap-4 border-t-2 border-border px-5 py-4" aria-live="polite">
          <div className="text-sm">
            <p className="font-bold">{right ? 'Correct!' : 'Not quite.'}</p>
            {explanation && <p className="mt-1 text-muted-foreground">{explanation}</p>}
          </div>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
          >
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      )}
    </div>
  )
}
