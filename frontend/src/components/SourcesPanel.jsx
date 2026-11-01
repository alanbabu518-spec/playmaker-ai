import SourceCard from './SourceCard'

function Skeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5" aria-hidden="true">
      <div className="h-4 w-1/2 rounded bg-sage motion-safe:animate-pulse" />
      <div className="mt-3 h-3 w-full rounded bg-sage motion-safe:animate-pulse" />
      <div className="mt-2 h-3 w-2/3 rounded bg-sage motion-safe:animate-pulse" />
    </div>
  )
}

// Desktop: a column on the right. Phone: a sheet at the bottom, holding the composer passed as children.
export default function SourcesPanel({ loading = false, used = [], checked = [], children }) {
  return (
    <aside className="flex max-h-[62dvh] min-h-0 flex-col rounded-t-3xl bg-sage md:max-h-none md:w-[340px] md:shrink-0 md:rounded-none">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 md:px-6 md:pt-8">
        {loading ? (
          <>
            <h2 className="text-lg font-semibold">Sources</h2>
            <div className="mt-4 space-y-3">
              <Skeleton />
              <Skeleton />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">
              <span className="md:hidden">Sources used ({used.length})</span>
              <span className="hidden md:inline">Used in this answer</span>
            </h2>
            <div className="mt-4 space-y-3">
              {used.map(({ n, source }) => (
                <SourceCard key={source.id} n={n} source={source} />
              ))}
            </div>
            {checked.length > 0 ? (
              <details className="mt-5 pb-5">
                <summary className="cursor-pointer text-base font-semibold">Also checked ({checked.length})</summary>
                <div className="mt-3 space-y-3">
                  {checked.map((source) => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </div>
              </details>
            ) : null}
          </>
        )}
      </div>
      {children ? <div className="px-5 pb-5 pt-3 md:hidden">{children}</div> : null}
    </aside>
  )
}