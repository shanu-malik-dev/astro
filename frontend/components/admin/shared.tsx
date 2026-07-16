import { Plus } from "lucide-react";

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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[12px] uppercase tracking-[0.35em] text-gold-dark">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          {title}
        </h1>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-gold hover:bg-gold/10"
      >
        <Plus size={17} />
        {createLabel}
      </button>
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
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, index) => {
        const page = index + 1;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? "rounded-md border border-gold bg-gold px-3 py-1.5 text-sm font-medium text-black"
                : "rounded-md border border-mist bg-white px-3 py-1.5 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink"
            }
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}
