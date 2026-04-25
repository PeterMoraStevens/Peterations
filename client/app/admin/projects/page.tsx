import { getProjects } from '@/lib/db/projects'
import { ProjectsEditor } from '@/components/admin/ProjectsEditor'

export default async function AdminProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  try {
    projects = await getProjects()
  } catch {
    projects = []
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Projects</h1>
      <ProjectsEditor initialProjects={projects} />
    </div>
  )
}
