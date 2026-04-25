'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, Sun, Moon } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/photography', label: 'Photos' },
  { href: '/about', label: 'About' },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg border-2 border-border shadow-brutal-sm bg-card hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all"
      aria-label="Toggle dark mode"
    >
      {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

export function ChromeNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-primary border-b-2 border-border shadow-[0_2px_0px_var(--border)]">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link
          href="/"
          className="font-bold text-xl tracking-tight hover:underline underline-offset-4"
        >
          Peter Mora-Stevens
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-transparent transition-all',
                pathname === link.href
                  ? 'border-border bg-foreground text-background shadow-brutal-sm'
                  : 'hover:border-border hover:bg-card hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile row */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg border-2 border-border shadow-brutal-sm bg-card hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t-2 border-border bg-primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-4 py-3 text-sm font-semibold border-b border-border/20 transition-colors',
                pathname === link.href ? 'bg-foreground text-background' : 'hover:bg-card/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
