'use client'

import React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FileText, Camera, User, LogOut, FolderGit2, BookOpen } from 'lucide-react'

const adminSections = [
  { href: '/admin/blog', icon: FileText, label: 'Blog Posts', desc: 'Manage post metadata and publish state' },
  { href: '/admin/projects', icon: FolderGit2, label: 'Projects', desc: 'Add and manage projects' },
  { href: '/admin/photography', icon: Camera, label: 'Photography', desc: 'Upload and manage photos' },
  { href: '/admin/about', icon: User, label: 'About', desc: 'Edit bio, links, and experience' },
  { href: '/admin/visitors', icon: BookOpen, label: "Visitor's Book", desc: 'Approve and manage visitor messages' },
]

export default function AdminDashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut size={14} />
          Sign out
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href} className="block group">
              <div className="bg-white border-2 border-border shadow-brutal rounded-2xl p-6 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-brutal-lg transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 border-2 border-border shadow-brutal-sm bg-accent rounded-lg">
                    <Icon size={18} />
                  </div>
                  <h2 className="font-bold text-lg">{section.label}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{section.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
