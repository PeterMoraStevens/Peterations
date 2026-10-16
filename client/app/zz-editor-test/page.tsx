// TEMPORARY test harness — delete after testing.
import { BlogEditor } from '@/components/admin/BlogEditor'

export default function Page() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BlogEditor initialPost={{ title: 'Test post', slug: 'test-post', excerpt: 'Summary', tags: ['a'], published: false, imagePaths: [], content: "## Intro & setup\n\nSome **bold**, *italic*, <u>under</u>, ~~strike~~, `code {x}`, H<sub>2</sub>O and x<sup>2</sup>. A literal &#123;curly&#125; and a &lt; b &gt; c, plus [a link](https://example.com).\n\nLegacy <mark data-color=\"yellow\">highlight</mark> and <mark data-color=\"green\">new</mark> and <span data-text-color=\"red\">red text</span>.\n\n<Callout type=\"note\">\n\nOld style callout text\n\n</Callout>\n\n<Callout type=\"tip\" label=\"Pro tip\">\n\nRich **callout** with a [link](https://x.y).\n\nSecond paragraph.\n\n</Callout>\n\n<Toggle summary=\"Click me\">\n\nHidden *content* here.\n\n- a\n- b\n\n</Toggle>\n\n<BlogImage src=\"https://cdn.petermorastevens.rocks/blog/a.jpg\" alt=\"A &quot;quoted&quot; alt\" caption=\"Nice pic\" width=\"50\" align=\"right\" aspect=\"16/9\" />\n\n<BlogImage src=\"https://cdn.petermorastevens.rocks/blog/b.jpg\" alt=\"plain\" />\n\n<Embed url=\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\" caption=\"Video\" />\n\n<Chart type=\"line\" title=\"Weekly\" unit=\"%\" data=\"%5B%7B%22label%22%3A%22Mon%22%2C%22value%22%3A3%7D%2C%7B%22label%22%3A%22Tue%22%2C%22value%22%3A5%7D%5D\" />\n\n<Quiz question=\"2 + 2 = {?}\" options=\"%5B%223%22%2C%224%22%2C%225%22%5D\" answer=\"1\" explanation=\"Math.\" />\n\n```ts\nconst x = { a: 1 } // <tag>\n```\n\n| Name | Value |\n| --- | --- |\n| a | **1** |\n| b | 2 |\n\n- [ ] todo\n\n- [x] done\n\n### Sub heading\n\n> quote\n\n---\n\nEnd." }} />
    </div>
  )
}
