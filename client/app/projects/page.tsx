import type { Metadata } from 'next'
import { getProjects } from '@/lib/db/projects'
import { ProjectCard } from '@/components/projects/ProjectCard'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Things I have built.',
}

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  try {
    projects = await getProjects()
  } catch {
    projects = []
  }

  const featured = projects.filter((p) => p.featured)
  const rest = projects.filter((p) => !p.featured)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">Projects</h1>
        <p className="text-base font-medium text-muted-foreground max-w-lg">
          Things I have built — side projects, tools, and experiments.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="border-2 border-border shadow-brutal rounded-2xl p-12 text-center bg-card">
          <p className="font-bold text-xl mb-2">No projects yet.</p>
          <p className="text-sm text-muted-foreground">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {featured.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">Featured</h2>
                <div className="flex-1 h-0.5 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featured.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold">More</h2>
                  <div className="flex-1 h-0.5 bg-border" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rest.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
