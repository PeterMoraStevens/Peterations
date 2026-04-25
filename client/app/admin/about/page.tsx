import { AboutEditor } from '@/components/admin/AboutEditor'
import { getAboutProfile, getTimeline, getAboutLinks } from '@/lib/db/about'

export default async function AdminAboutPage() {
  const [profile, timeline, links] = await Promise.all([
    getAboutProfile(),
    getTimeline(),
    getAboutLinks().catch(() => []),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">About</h1>
      <AboutEditor initialProfile={profile} initialTimeline={timeline} initialLinks={links} />
    </div>
  )
}
