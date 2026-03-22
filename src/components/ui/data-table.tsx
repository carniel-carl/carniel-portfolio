"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  paginated?: boolean;
  enableFiltering?: boolean;
  filterColumns?: string[];
  sortColumns?: SortingState;
  filteredValue?: string;
  compactHeight?: boolean;
  getRowClassName?: (row: TData) => string | undefined;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  paginated = true,
  enableFiltering = false,
  filterColumns = [],
  sortColumns = [],
  filteredValue = "",
  compactHeight = false,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>(sortColumns);
  const [globalFilter, setGlobalFilter] = useState<string>(filteredValue);

  const customGlobalFilter: FilterFn<TData> = (row, columnId, filterValue) => {
    const text = String(filterValue).toLowerCase();

    if (filterColumns.length > 0 && !filterColumns.includes(columnId)) {
      return false;
    }

    const cellValue = row.getValue(columnId);
    return String(cellValue).toLowerCase().includes(text);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(paginated && { getPaginationRowModel: getPaginationRowModel() }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      globalFilterFn: customGlobalFilter,
      enableGlobalFilter: true,
    }),
    onSortingChange: setSorting,
    state: {
      columnFilters,
      globalFilter,
      sorting,
    },
  });

  const topHeaders = table.getHeaderGroups()[0].headers;

  return (
    <div className="flex flex-col gap-y-4">
      {/* Filtering */}
      {enableFiltering && (
        <div className="flex items-center">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={
              filterColumns.length > 0
                ? `Search ${filterColumns.join(", ")}...`
                : "Search..."
            }
            className="max-w-sm h-10"
          />
        </div>
      )}

      {/* Desktop: full table */}
      <div
        className={cn(
          "hidden lg:block rounded-md border overflow-hidden",
          compactHeight &&
            "overflow-auto max-h-[70dvh] border-t-2 border-border no-scrollbar",
        )}
      >
        <Table>
          <TableHeader className="bg-secondary">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={cn(getRowClassName?.(row.original))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4 text-foreground">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card layout */}
      <div
        className={cn(
          "lg:hidden space-y-3",
          compactHeight &&
            "max-h-[80dvh] overflow-auto no-scrollbar border-t border-border",
        )}
      >
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "bg-background p-4 rounded-lg shadow-sm border border-input",
                getRowClassName?.(row.original),
              )}
            >
              {row.getVisibleCells().map((cell) => {
                const header = topHeaders.find((h) => h.id === cell.column.id);

                return (
                  <div key={cell.id} className="flex justify-between py-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      {header
                        ? flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        : cell.column.id}
                    </span>
                    <span className="text-sm text-foreground">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No results.
          </div>
        )}
      </div>

      {paginated && table.getRowModel().rows.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
