import React from 'react'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import type { MDXRemoteProps } from 'next-mdx-remote/rsc'
import { BlogImage } from './BlogImage'
import { Callout } from './Callout'
import { Chart } from './Chart'
import { CodeBlock } from './CodeBlock'
import { Embed } from './Embed'
import { Quiz } from './Quiz'
import { Toggle } from './Toggle'
import { normalizeHighlight } from '@/lib/blog/content'

// Every component a post can use. The editor serialises to exactly these tags.
export const mdxComponents: MDXRemoteProps['components'] = {
  pre: (props: React.ComponentPropsWithoutRef<'pre'>) => <CodeBlock {...props} />,
  img: ({ src, alt }: React.ComponentPropsWithoutRef<'img'>) => (
    <BlogImage src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
  mark: ({ children, ...props }: React.ComponentPropsWithoutRef<'mark'> & { 'data-color'?: string }) => (
    <mark data-color={normalizeHighlight(props['data-color'])}>{children}</mark>
  ),
  a: ({ href = '', children, ...props }: React.ComponentPropsWithoutRef<'a'>) => {
    const external = /^https?:\/\//.test(href)
    return (
      <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  table: (props: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-8 overflow-x-auto p-1">
      <table {...props} className="my-0" />
    </div>
  ),
  BlogImage,
  Callout,
  Chart,
  Embed,
  Quiz,
  Toggle,
}

export const mdxOptions: MDXRemoteProps['options'] = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypePrettyCode, { theme: 'github-dark', keepBackground: false, defaultLang: 'plaintext' }],
    ],
  },
}
