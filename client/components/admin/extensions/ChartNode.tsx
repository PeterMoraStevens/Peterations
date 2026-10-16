'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { BarChart3, Plus, X } from 'lucide-react'
import { Chart } from '@/components/blog/Chart'
import { CHART_TYPES, DEFAULT_CHART, decodeData, encodeData, readProps, type ChartDatum, type ChartType } from '@/lib/blog/content'
import { BlockFrame, Field, Segmented, inputCls } from './BlockFrame'
import { selfClosing } from './markdown'

function ChartView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { chartType, title, unit } = node.attrs as { chartType: ChartType; title: string; unit: string }
  const data = node.attrs.data as ChartDatum[]

  const setRow = (i: number, patch: Partial<ChartDatum>) =>
    updateAttributes({ data: data.map((d, j) => (j === i ? { ...d, ...patch } : d)) })

  return (
    <BlockFrame
      icon={BarChart3}
      label="Chart"
      selected={selected}
      onDelete={deleteNode}
      panel={
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Type">
              <Segmented value={chartType} options={CHART_TYPES} onChange={(t) => updateAttributes({ chartType: t })} />
            </Field>
            <Field label="Title">
              <input className={inputCls} value={title} placeholder="Optional" onChange={(e) => updateAttributes({ title: e.target.value })} />
            </Field>
            <Field label="Unit">
              <input className={`${inputCls} w-20`} value={unit} placeholder="%, $, ms" onChange={(e) => updateAttributes({ unit: e.target.value })} />
            </Field>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Data</span>
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={inputCls} value={d.label} placeholder="Label" onChange={(e) => setRow(i, { label: e.target.value })} />
                <input
                  className={`${inputCls} w-28 font-mono`}
                  type="number"
                  value={Number.isFinite(d.value) ? d.value : ''}
                  onChange={(e) => setRow(i, { value: e.target.valueAsNumber })}
                />
                <button
                  type="button"
                  title="Remove row"
                  onClick={() => updateAttributes({ data: data.filter((_, j) => j !== i) })}
                  className="rounded-lg p-1.5 hover:bg-muted"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateAttributes({ data: [...data, { label: `Item ${data.length + 1}`, value: 0 }] })}
              className="flex items-center gap-1 rounded-lg border-2 border-dashed border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
            >
              <Plus size={12} /> Add row
            </button>
          </div>
        </>
      }
    >
      <Chart type={chartType} title={title} unit={unit} data={encodeData(data)} />
    </BlockFrame>
  )
}

export const ChartNode = Node.create({
  name: 'chart',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      chartType: { default: 'bar' },
      title: { default: '' },
      unit: { default: '' },
      data: { default: DEFAULT_CHART },
    }
  },

  parseHTML() {
    return [{
      tag: 'div[data-node="chart"]',
      getAttrs: (el) => {
        const p = readProps(el as HTMLElement)
        return { chartType: p.type || 'bar', title: p.title ?? '', unit: p.unit ?? '', data: decodeData(p.data, DEFAULT_CHART) }
      },
    }]
  },

  renderHTML({ node }) {
    const { chartType, title, unit, data } = node.attrs
    return ['div', { 'data-node': 'chart', 'data-props': encodeData({ type: chartType, title, unit, data: encodeData(data) }) }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: selfClosing('Chart', (n) => ({
          type: n.attrs.chartType,
          title: n.attrs.title,
          unit: n.attrs.unit,
          data: encodeData((n.attrs.data as ChartDatum[]).filter((d) => d.label || Number.isFinite(d.value))),
        })),
        parse: {},
      },
    }
  },
})
