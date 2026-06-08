import { useCallback, useState } from 'react'
import StatsCards from '../../components/admin/StatsCards'
import MemberFilter from '../../components/admin/MemberFilter'
import MemberTable from '../../components/admin/MemberTable'
import Pagination from '../../components/admin/Pagination'
import { useQuery } from '@tanstack/react-query'
import { getMembers } from '../../api/adminApi'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useCallback(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Members() {
  const [filters, setFilters] = useState({ search: '', status: 'all', dateFrom: '', dateTo: '' })
  const [page, setPage] = useState(1)

  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleFilterChange = (next) => {
    const updated = { ...filters, ...next }
    setFilters(updated)
    setPage(1)

    // simple debounce for search
    if ('search' in next) {
      clearTimeout(window._searchDebounce)
      window._searchDebounce = setTimeout(() => setDebouncedSearch(next.search), 300)
    }
  }

  const filterParams = {
    search: debouncedSearch,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    page,
    size: 20,
  }

  const { data } = useQuery({
    queryKey: ['members', filterParams],
    queryFn: () => getMembers(filterParams),
  })

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-5">
      <StatsCards />

      <MemberFilter values={filters} onChange={handleFilterChange} />

      <MemberTable filterParams={filterParams} />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
