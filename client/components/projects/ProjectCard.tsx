import { ExternalLink, GitFork } from 'lucide-react'
import type { Project } from '@/types'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-card border-2 border-border shadow-brutal rounded-2xl overflow-hidden flex flex-col h-full">
      {project.imageUrl && (
        <div className="border-b-2 border-border overflow-hidden shrink-0" style={{ aspectRatio: '16/9' }}>
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-snug">{project.title}</h3>
          {project.featured && (
            <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold bg-primary border border-border rounded-md">Featured</span>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{project.description}</p>
        )}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {project.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-[11px] font-semibold bg-muted border border-border rounded-md">{tag}</span>
            ))}
          </div>
        )}
        {(project.url || project.repoUrl) && (
          <div className="flex gap-2 mt-auto pt-2">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-2 border-border rounded-lg shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all bg-card"
              >
                <ExternalLink size={12} /> Live
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-2 border-border rounded-lg shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all bg-card"
              >
                <GitFork size={12} /> Repo
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
