export default function RecipesLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-parchment rounded mb-2" />
        <div className="h-8 w-48 bg-parchment rounded mb-2" />
        <div className="h-4 w-64 bg-parchment rounded" />
      </div>

      {/* Three-panel layout */}
      <div className="hidden lg:flex gap-6 items-start">
        {/* Left: Deliverables */}
        <aside className="w-64 xl:w-72 shrink-0">
          <div className="bg-parchment rounded-xl h-64" />
        </aside>

        {/* Center: Flower Browser */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="h-12 bg-parchment rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-parchment rounded-lg" />
            ))}
          </div>
        </div>

        {/* Right: Recipe Card */}
        <aside className="w-72 xl:w-80 shrink-0">
          <div className="bg-parchment rounded-xl h-80" />
        </aside>
      </div>

      {/* Mobile: single panel */}
      <div className="lg:hidden space-y-4">
        <div className="h-12 bg-parchment rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-parchment rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
