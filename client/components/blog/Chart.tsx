'use client'

import React, { useId, useState } from 'react'
import { decodeData, DEFAULT_CHART, type ChartDatum, type ChartType } from '@/lib/blog/content'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)']

interface ChartProps {
  type?: ChartType | string
  title?: string
  /** URI-encoded JSON array of `{ label, value }`. */
  data?: string
  unit?: string
}

export function Chart({ type = 'bar', title, data, unit }: ChartProps) {
  const rows = decodeData<ChartDatum[]>(data, DEFAULT_CHART).filter((d) => d && Number.isFinite(Number(d.value)))
  return (
    <figure className="not-prose my-8 rounded-2xl border-2 border-border bg-card p-5 shadow-brutal">
      {title && <figcaption className="mb-4 font-bold">{title}</figcaption>}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : type === 'pie' ? (
        <PieChart rows={rows} unit={unit} />
      ) : (
        <XYChart rows={rows} kind={type === 'line' || type === 'area' ? type : 'bar'} unit={unit} />
      )}
    </figure>
  )
}

function fmt(v: number, unit?: string) {
  const n = Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return unit ? `${n}${unit}` : n
}

function niceMax(v: number) {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp
}

function XYChart({ rows, kind, unit }: { rows: ChartDatum[]; kind: 'bar' | 'line' | 'area'; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const gradId = useId()
  const W = 640, H = 280, L = 44, R = 12, T = 16, B = 32
  const values = rows.map((r) => Number(r.value))
  const min = Math.min(0, ...values)
  const max = niceMax(Math.max(...values))
  const span = max - min || 1
  const iw = W - L - R, ih = H - T - B
  const y = (v: number) => T + ih - ((v - min) / span) * ih
  const band = iw / rows.length
  const x = (i: number) => L + band * i + band / 2
  const ticks = Array.from({ length: 5 }, (_, i) => min + (span * i) / 4)

  const line = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(Number(r.value))}`).join(' ')
  const area = `${line} L${x(rows.length - 1)},${y(Math.max(min, 0))} L${x(0)},${y(Math.max(min, 0))} Z`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeOpacity={0.15} strokeDasharray="4 4" />
            <text x={L - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] font-mono">
              {fmt(Math.round(t * 100) / 100)}
            </text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={y(Math.max(min, 0))} y2={y(Math.max(min, 0))} stroke="var(--border)" strokeWidth={2} />

        {kind === 'bar' && rows.map((r, i) => {
          const v = Number(r.value)
          const top = y(Math.max(v, 0)), bottom = y(Math.min(v, 0))
          const bw = Math.min(56, band * 0.62)
          return (
            <rect
              key={i}
              x={x(i) - bw / 2}
              y={top}
              width={bw}
              height={Math.max(1, bottom - top)}
              rx={6}
              fill={COLORS[i % COLORS.length]}
              stroke="var(--border)"
              strokeWidth={2}
              opacity={hover === null || hover === i ? 1 : 0.55}
              className="transition-opacity"
            />
          )
        })}

        {kind === 'area' && <path d={area} fill={`url(#${gradId})`} />}
        {kind !== 'bar' && (
          <>
            <path d={line} fill="none" stroke="var(--border)" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            <path d={line} fill="none" stroke="var(--chart-1)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {rows.map((r, i) => (
              <circle key={i} cx={x(i)} cy={y(Number(r.value))} r={hover === i ? 6 : 4} fill="var(--card)" stroke="var(--border)" strokeWidth={2} className="transition-all" />
            ))}
          </>
        )}

        {rows.map((r, i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
            {r.label}
          </text>
        ))}

        {/* Hit areas for the tooltip */}
        {rows.map((_, i) => (
          <rect
            key={i}
            x={L + band * i}
            y={T}
            width={band}
            height={ih}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border-2 border-border bg-card px-2.5 py-1 text-xs font-semibold shadow-brutal-sm whitespace-nowrap"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(Number(rows[hover].value)) / H) * 100}%`, marginTop: -8 }}
        >
          {rows[hover].label}: {fmt(Number(rows[hover].value), unit)}
        </div>
      )}
    </div>
  )
}

function PieChart({ rows, unit }: { rows: ChartDatum[]; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const values = rows.map((r) => Math.max(0, Number(r.value)))
  const total = values.reduce((a, b) => a + b, 0) || 1
  const R = 100, C = 110
  const cumulative = values.map((_, i) => values.slice(0, i).reduce((a, b) => a + b, 0))

  const slices = values.map((v, i) => {
    const start = (cumulative[i] / total) * Math.PI * 2
    const end = ((cumulative[i] + v) / total) * Math.PI * 2
    const large = end - start > Math.PI ? 1 : 0
    const p = (a: number, r = R) => [C + r * Math.sin(a), C - r * Math.cos(a)]
    const [x1, y1] = p(start), [x2, y2] = p(end)
    const d = values.filter((n) => n > 0).length === 1 && v > 0
      ? `M${C},${C - R} A${R},${R} 0 1 1 ${C - 0.01},${C - R} Z`
      : `M${C},${C} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`
    return { d, i }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 220 220" className="w-52 h-52 shrink-0 overflow-visible" role="img">
        {slices.map(({ d, i }) => (
          <path
            key={i}
            d={d}
            fill={COLORS[i % COLORS.length]}
            stroke="var(--border)"
            strokeWidth={2}
            strokeLinejoin="round"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ transformOrigin: `${C}px ${C}px`, transform: hover === i ? 'scale(1.04)' : undefined }}
            className="transition-transform"
          />
        ))}
      </svg>
      <ul className="flex-1 w-full space-y-1.5">
        {rows.map((r, i) => (
          <li
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors ${hover === i ? 'bg-muted' : ''}`}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded border-2 border-border" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="font-semibold">{r.label}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {fmt(values[i], unit)} · {Math.round((values[i] / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
