import { Badge } from '@/components/ui/badge'
import { type TimelineEntry } from '@/types'

function formatPeriod(start: string, end?: string, current?: boolean) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${fmt(start)} — ${current || !end ? 'Present' : fmt(end)}`
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.order - b.order)

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-border" />

      <div className="flex flex-col gap-0">
        {sorted.map((entry) => (
          <div key={entry.id} className="relative pl-14 pb-10">
            <div className={`absolute left-[14px] top-1 w-4 h-4 border-2 border-border shadow-brutal-sm rounded-sm ${entry.current ? 'bg-primary' : 'bg-card'}`} />

            <div className="bg-card border-2 border-border shadow-brutal rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-black text-lg leading-tight">{entry.role}</h3>
                  <p className="font-bold text-sm text-primary">{entry.company}</p>
                </div>
                <time className="text-xs font-bold tracking-wider text-muted-foreground shrink-0">
                  {formatPeriod(entry.startDate, entry.endDate, entry.current)}
                </time>
              </div>

              {entry.description && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{entry.description}</p>
              )}

              {entry.bullets.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {entry.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <span className="text-primary font-bold shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {entry.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[10px]">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
