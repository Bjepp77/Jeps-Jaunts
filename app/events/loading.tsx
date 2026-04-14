export default function EventsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-4 w-24 bg-parchment rounded mb-2" />
        <div className="h-8 w-48 bg-parchment rounded" />
      </div>

      {/* Pipeline pills */}
      <div className="flex gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-parchment rounded-full" />
        ))}
      </div>

      {/* Create form placeholder */}
      <div className="h-16 bg-parchment rounded-lg mb-8" />

      {/* Event cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-parchment rounded-lg h-24"
          />
        ))}
      </div>
    </div>
  )
}
