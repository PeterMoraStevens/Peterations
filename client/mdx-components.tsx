import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from '@/components/blog/CodeBlock'
import { Callout } from '@/components/blog/Callout'

export function useMDXComponents(): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1
        className="text-4xl font-black mb-6 mt-8 border-b-2 border-black pb-2"
        style={{ fontFamily: 'Orbitron, monospace' }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        className="text-2xl font-black mb-4 mt-10 inline-block border-l-4 border-[#ff4800] pl-3"
        style={{ fontFamily: 'Orbitron, monospace' }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-black mb-3 mt-6">{children}</h3>
    ),
    pre: ({ children, ...props }) => (
      <CodeBlock {...props}>{children}</CodeBlock>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#ff4800] pl-4 my-6 italic bg-[#fff8f5] py-3 border-2 border-l-4 shadow-[3px_3px_0px_#0f0f0f]">
        {children}
      </blockquote>
    ),
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="font-bold underline underline-offset-4 text-[#ff4800] hover:bg-[#ff4800] hover:text-white transition-colors px-0.5"
        {...props}
      >
        {children}
      </a>
    ),
    code: ({ children, ...props }) => (
      <code
        className="bg-[#0f0f0f] text-[#00e5a0] px-1.5 py-0.5 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    ),
    ul: ({ children }) => (
      <ul className="my-4 space-y-1 list-none pl-0">
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li className="flex gap-2 before:content-['▸'] before:text-[#ff4800] before:font-black before:shrink-0">
        <span>{children}</span>
      </li>
    ),
    hr: () => <hr className="my-8 border-0 border-t-2 border-black" />,
    img: ({ src, alt, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ''}
        className="my-6 w-full border-2 border-black shadow-[4px_4px_0px_#0f0f0f] object-cover"
        {...props}
      />
    ),
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto border-2 border-black shadow-[4px_4px_0px_#0f0f0f]">
        <table className="w-full">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-black text-white font-black text-sm px-4 py-2 text-left border-r-2 border-white last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-sm border-t-2 border-black border-r-2 last:border-r-0">
        {children}
      </td>
    ),
    Callout,
  }
}
