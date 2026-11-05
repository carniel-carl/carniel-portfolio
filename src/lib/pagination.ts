/** A `?page=` value as a page number, 1 when missing or junk. */
export const parsePage = (value: string | undefined) => Math.max(1, parseInt(value || "1", 10) || 1);

export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

// 1 ... 4 5 6 ... 12: current page, its neighbours and both ends
export const pageList = (page: number, total: number): (number | "gap")[] => {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
};
