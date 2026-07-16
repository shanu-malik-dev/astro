import { ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { MODULES } from "./constants";
import type { ModuleKey } from "./types";

export function AdminSidebar({
  activeModule,
  sidebarOpen,
  onModuleChange,
  onToggle,
}: {
  activeModule: ModuleKey;
  sidebarOpen: boolean;
  onModuleChange: (module: ModuleKey) => void;
  onToggle: () => void;
}) {
  return (
    <aside
      className={`border-r border-mist bg-white transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-mist px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-sm font-bold text-black">
            A
          </div>
          {sidebarOpen && (
            <span className="font-display text-xl italic">
              Astro<span className="text-gold not-italic">Admin</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md border border-mist p-1.5 text-ink/60 hover:text-ink"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <nav className="space-y-1 px-3 py-5">
        <p className={`px-3 pb-2 text-[11px] uppercase tracking-[0.16em] text-ink/40 ${sidebarOpen ? "" : "sr-only"}`}>
          Manage
        </p>
        {MODULES.map((module) => {
          const Icon = module.icon;
          const active = activeModule === module.key;

          return (
            <button
              key={module.key}
              type="button"
              onClick={() => onModuleChange(module.key)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-gold/15 text-ink"
                  : "text-ink/65 hover:bg-parchment hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {sidebarOpen && <span>{module.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
