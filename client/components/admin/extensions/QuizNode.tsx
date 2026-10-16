'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { HelpCircle, Plus, X, Check } from 'lucide-react'
import { Quiz } from '@/components/blog/Quiz'
import { DEFAULT_QUIZ, decodeData, encodeData, readProps } from '@/lib/blog/content'
import { cn } from '@/lib/utils'
import { BlockFrame, Field, inputCls } from './BlockFrame'
import { selfClosing } from './markdown'

function QuizView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { question, answer, explanation } = node.attrs as { question: string; answer: number; explanation: string }
  const options = node.attrs.options as string[]

  return (
    <BlockFrame
      icon={HelpCircle}
      label="Quiz"
      selected={selected}
      onDelete={deleteNode}
      panel={
        <>
          <Field label="Question">
            <input className={inputCls} value={question} onChange={(e) => updateAttributes({ question: e.target.value })} />
          </Field>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Answers — tick the correct one</span>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  title="Mark as correct"
                  onClick={() => updateAttributes({ answer: i })}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-border',
                    i === answer ? 'bg-secondary' : 'bg-card hover:bg-muted',
                  )}
                >
                  {i === answer ? <Check size={14} /> : <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>}
                </button>
                <input
                  className={inputCls}
                  value={o}
                  onChange={(e) => updateAttributes({ options: options.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                <button
                  type="button"
                  title="Remove answer"
                  disabled={options.length <= 2}
                  onClick={() =>
                    updateAttributes({
                      options: options.filter((_, j) => j !== i),
                      answer: answer === i ? 0 : answer > i ? answer - 1 : answer,
                    })
                  }
                  className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {options.length < 6 && (
              <button
                type="button"
                onClick={() => updateAttributes({ options: [...options, `Option ${options.length + 1}`] })}
                className="flex items-center gap-1 rounded-lg border-2 border-dashed border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
              >
                <Plus size={12} /> Add answer
              </button>
            )}
          </div>
          <Field label="Explanation (shown after answering)">
            <input className={inputCls} value={explanation} placeholder="Optional" onChange={(e) => updateAttributes({ explanation: e.target.value })} />
          </Field>
        </>
      }
    >
      {/* key resets the preview's picked state whenever the quiz is edited */}
      <Quiz key={JSON.stringify(node.attrs)} question={question} options={encodeData(options)} answer={answer} explanation={explanation} />
    </BlockFrame>
  )
}

export const QuizNode = Node.create({
  name: 'quiz',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      question: { default: DEFAULT_QUIZ.question },
      options: { default: DEFAULT_QUIZ.options },
      answer: { default: DEFAULT_QUIZ.answer },
      explanation: { default: DEFAULT_QUIZ.explanation ?? '' },
    }
  },

  parseHTML() {
    return [{
      tag: 'div[data-node="quiz"]',
      getAttrs: (el) => {
        const p = readProps(el as HTMLElement)
        return {
          question: p.question ?? '',
          options: decodeData<string[]>(p.options, ['', '']),
          answer: Number(p.answer ?? 0),
          explanation: p.explanation ?? '',
        }
      },
    }]
  },

  renderHTML({ node }) {
    const { question, options, answer, explanation } = node.attrs
    return ['div', { 'data-node': 'quiz', 'data-props': encodeData({ question, options: encodeData(options), answer: String(answer), explanation }) }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuizView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: selfClosing('Quiz', (n) => ({
          question: n.attrs.question,
          options: encodeData(n.attrs.options),
          answer: n.attrs.answer,
          explanation: n.attrs.explanation,
        })),
        parse: {},
      },
    }
  },
})
