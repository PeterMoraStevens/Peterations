import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { ChromeNav } from '@/components/chrome/ChromeNav'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ScrollToTop } from '@/components/ScrollToTop'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Peter Mora-Stevens',
    template: '%s | Peter Mora-Stevens',
  },
  description: 'A blog, some photography, and a bit about me.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ScrollToTop />
          <ChromeNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
