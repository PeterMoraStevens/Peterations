export default function BlogPostLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-4 w-20 bg-muted rounded-lg mb-8" />
      <div className="border-2 border-border rounded-2xl p-8 bg-primary/30 mb-12">
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-16 bg-primary rounded-lg" />
          <div className="h-5 w-12 bg-primary rounded-lg" />
        </div>
        <div className="h-10 bg-primary/60 rounded-lg mb-3 w-3/4" />
        <div className="h-10 bg-primary/60 rounded-lg mb-6 w-1/2" />
        <div className="flex gap-4">
          <div className="h-4 w-28 bg-primary/40 rounded" />
          <div className="h-4 w-20 bg-primary/40 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    </div>
  )
}
