import { ChevronLeft, ChevronRight } from 'lucide-react'

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default function Pagination({ page, totalPages, onPageChange }) {
  const pages = buildPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.12)] text-[#253900] hover:bg-[rgba(0,0,0,0.08)] disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`e-${idx}`} className="px-1 text-sm text-[rgba(0,0,0,0.52)]">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              page === p ? 'bg-[#253900] text-[#EEEEEE]' : 'text-[#253900] hover:bg-[rgba(0,0,0,0.08)]',
            ].join(' ')}
          >
            {p}
          </button>
        ),
      )}

      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.12)] text-[#253900] hover:bg-[rgba(0,0,0,0.08)] disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
