import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ListFilter, Plus, Rows3, X } from "lucide-react";
import CustomDatePicker, { type DateRangeValue } from "@/components/ui/CustomDatePicker";

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
        <circle cx="132" cy="82" r="18" fill="var(--admin-accent-soft)" stroke="var(--admin-accent)" strokeWidth="4" />
        <path d="M123 82h18" stroke="var(--admin-accent)" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <p>{loading ? "Loading..." : message}</p>
    </div>
  );
}

export function formatAdminDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function toAdminDateRange(range: DateRangeValue) {
  return {
    start: range.start ? new Date(range.start).toISOString() : "",
    end: range.end ? new Date(range.end).toISOString() : "",
  };
}

export function DateRangeFilter({
  value,
  onChange,
  onClear,
  hasValue,
  placeholder = "Created date",
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  onApply?: (value: DateRangeValue) => void;
  onClear: () => void;
  hasValue: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CustomDatePicker
        dateRange
        rangeValue={value}
        onRangeChange={onChange}
        placeholder={placeholder}
        variant="light"
        className="w-full sm:w-44"
      />
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-mist bg-white text-ink/60 transition hover:border-gold hover:text-ink"
          title="Clear date filter"
          aria-label="Clear date filter"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function ListPanelHeader({
  title,
  totalRecords,
  createLabel,
  onCreate,
  onList,
  onSort,
  sortDirection,
  loading,
}: {
  title: string;
  totalRecords: number;
  createLabel?: string;
  onCreate?: () => void;
  onList?: () => void;
  onSort?: () => void;
  sortDirection?: "asc" | "desc";
  loading?: boolean;
}) {
  const scrollToList = () => {
    onList?.();
    document
      .querySelector<HTMLElement>("[data-admin-list]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-3 border-b border-mist bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="text-[11px] text-ink/50">{totalRecords} total records</p>
      </div>
      <div className="admin-toolbar">
        <button type="button" onClick={scrollToList} className="admin-toolbar-button">
          <Rows3 size={15} />
          <span>List</span>
        </button>
        {onSort && (
          <button
            type="button"
            onClick={onSort}
            className="admin-toolbar-button"
            title={sortDirection ? `Sorted ${sortDirection}` : "Sort list"}
          >
            <ListFilter size={15} />
            <span>Sort</span>
          </button>
        )}
        {onCreate && createLabel && (
          <button
            type="button"
            onClick={onCreate}
            className="admin-create-button"
          >
            <Plus size={16} />
            <span>{createLabel}</span>
          </button>
        )}
        {loading && <span className="text-xs text-ink/50">Loading</span>}
      </div>
    </div>
  );
}

export function ModuleHeader({
  eyebrow,
  title,
  createLabel,
  onCreate,
  onList,
  onSort,
  sortDirection,
}: {
  eyebrow: string;
  title: string;
  createLabel: string;
  onCreate: () => void;
  onList?: () => void;
  onSort?: () => void;
  sortDirection?: "asc" | "desc";
}) {
  const scrollToList = () => {
    onList?.();

    document
      .querySelector<HTMLElement>("[data-admin-list]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return null;
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
