import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ListFilter, Plus, Rows3, Search } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active" || status === "new"
      ? "bg-green-50 text-green-700 ring-green-100"
      : "bg-ink/5 text-ink/55 ring-mist";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${tone}`}>
      {status}
    </span>
  );
}

export function EmptyListState({
  message = "No data found.",
  loading = false,
}: {
  message?: string;
  loading?: boolean;
}) {
  return (
    <div className="admin-empty-state">
      <svg
        viewBox="0 0 180 120"
        role="img"
        aria-label="No data"
        className="admin-empty-image"
      >
        <rect x="36" y="22" width="108" height="76" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
        <path d="M54 44h72M54 60h52M54 76h64" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <circle cx="132" cy="82" r="18" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
        <path d="M123 82h18" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <p>{loading ? "Loading..." : message}</p>
    </div>
  );
}

export function ModuleHeader({
  eyebrow,
  title,
  createLabel,
  onCreate,
}: {
  eyebrow: string;
  title: string;
  createLabel: string;
  onCreate: () => void;
}) {
  return (
    <div className="admin-module-heading">
      <div>
        <h1 className="admin-title">
          {title}
        </h1>
      </div>
      <div className="admin-toolbar">
        <button type="button" className="admin-toolbar-button">
          <Rows3 size={15} />
          List
        </button>
        <button type="button" className="admin-toolbar-button">
          <ListFilter size={15} />
          Sort
        </button>
        <button type="button" className="admin-toolbar-button admin-toolbar-search">
          <Search size={15} />
          Find in this list
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="admin-create-button"
        >
          <Plus size={16} />
          {createLabel}
        </button>
      </div>
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const normalizedTotal = Math.max(1, totalPages);
  const page = Math.min(Math.max(1, currentPage), normalizedTotal);
  const startPage = Math.max(1, Math.min(page - 2, normalizedTotal - 4));
  const endPage = Math.min(normalizedTotal, startPage + 4);
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  const goToPage = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(1, nextPage), normalizedTotal);
    if (clampedPage !== page) onPageChange(clampedPage);
  };

  return (
    <div className="admin-pagination mt-5 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goToPage(1)}
        disabled={page === 1}
        className="admin-page-button"
        aria-label="First page"
      >
        <ChevronsLeft size={15} />
      </button>
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={page === 1}
        className="admin-page-button admin-page-nav"
      >
        <ChevronLeft size={15} />
        Prev
      </button>

      {startPage > 1 && (
        <span className="px-1 text-sm text-ink/40">...</span>
      )}

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => goToPage(item)}
          className={
            item === page
              ? "admin-page-button admin-page-button-active"
              : "admin-page-button"
          }
        >
          {item}
        </button>
      ))}

      {endPage < normalizedTotal && (
        <span className="px-1 text-sm text-ink/40">...</span>
      )}

      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={page === normalizedTotal}
        className="admin-page-button admin-page-nav"
      >
        Next
        <ChevronRight size={15} />
      </button>
      <button
        type="button"
        onClick={() => goToPage(normalizedTotal)}
        disabled={page === normalizedTotal}
        className="admin-page-button"
        aria-label="Last page"
      >
        <ChevronsRight size={15} />
      </button>
    </div>
  );
}
