import type { Metadata } from 'next'
import NextImage from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Timeline } from '@/components/about/Timeline'
import { getAboutProfile, getTimeline } from '@/lib/db/about'
import { User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description: "Background, experience, and what I'm up to.",
}

export default async function AboutPage() {
  const [profile, timeline] = await Promise.all([
    getAboutProfile().catch((): import('@/types').AboutProfile => ({ name: '', bio: '', skills: [] })),
    getTimeline().catch(() => []),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-16">
        <h1 className="text-5xl md:text-6xl font-black mb-4">ABOUT</h1>
      </header>

      {/* Bio */}
      <section className="mb-16">
        <div className="border-2 border-border shadow-brutal-lg bg-card p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 h-48 border-2 border-border shadow-brutal rounded-xl overflow-hidden bg-primary shrink-0 flex items-center justify-center">
              {profile.photoUrl ? (
                <NextImage src={profile.photoUrl} alt={profile.name || 'Profile'} width={192} height={192} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-primary-foreground" />
              )}
            </div>
            <div>
              {profile.name && (
                <h2 className="text-2xl font-black mb-3">{profile.name.toUpperCase()}</h2>
              )}
              {profile.bio ? (
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-base leading-relaxed text-muted-foreground italic">Bio coming soon.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      {profile.skills.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-black">SKILLS</h2>
            <div className="flex-1 h-0.5 bg-border" />
          </div>
          <div className="bg-secondary border-2 border-border shadow-brutal rounded-2xl p-6">
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-sm px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-black">EXPERIENCE</h2>
          <div className="flex-1 h-0.5 bg-border" />
        </div>
        {timeline.length === 0 ? (
          <div className="border-2 border-border shadow-brutal rounded-2xl p-12 text-center bg-card">
            <p className="font-black text-lg mb-2">Experience coming soon.</p>
            <p className="text-sm text-muted-foreground">Timeline entries will appear here once added via the admin panel.</p>
          </div>
        ) : (
          <Timeline entries={timeline} />
        )}
      </section>
    </div>
  )
}
