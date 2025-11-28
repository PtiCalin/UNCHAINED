import React, { useEffect, useMemo, useState } from 'react'
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, ColumnDef, flexRender, SortingState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { fetchTracks, type Track } from '../../services/api'

export default function TableView() {
  const [data, setData] = useState<Track[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => { fetchTracks().then(setData) }, [])

  const columns = useMemo<ColumnDef<Track>[]>(() => [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Artist', accessorKey: 'artist' },
    { header: 'Album', accessorKey: 'album' },
    { header: 'Duration', accessorKey: 'duration_ms', cell: ({ getValue }) => {
      const ms = Number(getValue() || 0); const m = Math.floor(ms/60000); const s = Math.round((ms%60000)/1000).toString().padStart(2,'0'); return `${m}:${s}`
    } },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    globalFilterFn: (row, columnId, filterValue) => {
      const v = String(row.getValue(columnId) ?? '').toLowerCase()
      return v.includes(String(filterValue).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const parentRef = React.useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 flex items-center gap-2">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Filter..."
          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
        />
      </div>
      <div className="border-t border-[#222]" />
      <div ref={parentRef} className="flex-1 overflow-auto" style={{ height: 'calc(100vh - 240px)' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#181818]">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="text-left px-3 py-2 cursor-pointer select-none" onClick={h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(vi => {
              const row = rows[vi.index]
              return (
                <tr key={row.id} className="border-b border-[#222]" style={{ position: 'absolute', transform: `translateY(${vi.start}px)` }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
