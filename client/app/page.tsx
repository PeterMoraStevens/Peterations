import React from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Camera, User, FolderGit2, Mail } from 'lucide-react'
import { FaGithub, FaXTwitter, FaLinkedinIn, FaInstagram, FaYoutube, FaGlobe } from 'react-icons/fa6'
import { getAboutLinks } from '@/lib/db/about'
import type { AboutLink } from '@/types'

const sections = [
  { href: '/blog', icon: BookOpen, label: 'Blog', desc: 'Writing on software, career, and everything else.', color: 'bg-card' },
  { href: '/projects', icon: FolderGit2, label: 'Projects', desc: "Things I've built and been able to host.", color: 'bg-secondary' },
  { href: '/photography', icon: Camera, label: 'Photos', desc: 'A visual and written log of places, light, and moments.', color: 'bg-accent' },
  { href: '/about', icon: User, label: 'About', desc: "Career experiences and what I'm up to.", color: 'bg-muted' },
]

function socialIcon(link: AboutLink) {
  const url = link.url.toLowerCase()
  if (url.includes('github.com'))    return <FaGithub size={18} />
  if (url.includes('twitter.com') || url.includes('x.com')) return <FaXTwitter size={18} />
  if (url.includes('linkedin.com'))  return <FaLinkedinIn size={18} />
  if (url.includes('instagram.com')) return <FaInstagram size={18} />
  if (url.includes('youtube.com'))   return <FaYoutube size={18} />
  if (url.startsWith('mailto:'))     return <Mail size={18} />
  return <FaGlobe size={18} />
}

export default async function HomePage() {
  const links = await getAboutLinks().catch(() => [] as AboutLink[])

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Hero */}
      <section className="mb-16">
        <div className="bg-primary border-2 border-border shadow-brutal-xl rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <h1 className="text-7xl md:text-9xl font-bold leading-none mb-6 tracking-tight">
              Peter<br />Mora-Stevens
            </h1>
            <p className="text-lg font-medium max-w-md mb-8 leading-relaxed">
              A personal corner of the internet. My Blog, some photography, and a little about me.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button asChild size="lg" variant="default">
                <Link href="/blog">Read my Blog <ArrowRight size={16} /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">About me</Link>
              </Button>
            </div>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    title={link.label}
                    className="p-2.5 border-2 border-border shadow-brutal-sm bg-card rounded-xl hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all"
                  >
                    {socialIcon(link)}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 md:self-end">
            <NextImage
              src="/mii-peterms.png"
              alt="Peter's Mii"
              width={450}
              height={600}
              className="drop-shadow-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Sections */}
      <section>
        <h2 className="text-2xl font-bold mb-6 tracking-wide">Explore</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-border shadow-brutal-lg rounded-2xl overflow-hidden">
          {sections.map((s, i) => {
            const Icon = s.icon
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`group p-8 border-border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal ${s.color} ${i < sections.length - 1 ? 'border-r-2' : ''}`}
              >
                <Icon size={28} className="mb-4" />
                <h3 className="font-bold text-lg mb-2">{s.label}</h3>
                <p className="text-sm leading-snug opacity-70">{s.desc}</p>
                <ArrowRight size={16} className="mt-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
