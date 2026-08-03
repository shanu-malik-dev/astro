import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { AdminModule, MasterModuleKey, ModuleKey } from "./types";

export function AdminSidebar({
  activeModule,
  modules,
  masterModules,
  sidebarOpen,
  activeMasterSubmodule,
  onModuleChange,
  onMasterSubmoduleChange,
  onToggle,
}: {
  activeModule: ModuleKey;
  modules: AdminModule[];
  masterModules: AdminModule[];
  sidebarOpen: boolean;
  activeMasterSubmodule: MasterModuleKey | null;
  onModuleChange: (module: ModuleKey) => void;
  onMasterSubmoduleChange: (module: MasterModuleKey) => void;
  onToggle: () => void;
}) {
  const [masterExpanded, setMasterExpanded] = useState(activeModule === "master");

  useEffect(() => {
    if (activeModule === "master") setMasterExpanded(true);
  }, [activeModule]);

  return (
    <aside
      className={`admin-sidebar border-r border-mist bg-white transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-mist px-4">
        <div className="flex items-center gap-2">
          {/* <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-sm font-bold text-black">
            A
          </div> */}
          {sidebarOpen && (
            <span className="font-display text-lg font-semibold italic leading-tight">
              {BRAND.name}
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
        {modules.map((module) => {
          const Icon = module.icon;
          const active = activeModule === module.key;
          const isMaster = module.key === "master";
          const showMasterSubnav = isMaster && masterExpanded && sidebarOpen;

          return (
            <div key={module.key}>
              <button
                type="button"
                onClick={() => {
                  if (isMaster) {
                    setMasterExpanded((expanded) => !expanded);
                    return;
                  }

                  onModuleChange(module.key);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-gold/15 text-gold-dark"
                    : "text-ink/65 hover:bg-gold/10 hover:text-gold-dark"
                }`}
              >
                <Icon size={17} />
                {sidebarOpen && (
                  <>
                    <span className="min-w-0 flex-1 text-left">{module.label}</span>
                    {isMaster && (
                      <ChevronDown
                        size={14}
                        className={`transition ${
                          masterExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </>
                )}
              </button>

              {showMasterSubnav && masterModules.length > 0 && (
                <div className="mt-1 space-y-1 border-l border-mist/80 pl-3">
                  {masterModules.map((submodule) => {
                    const SubIcon = submodule.icon;
                    const subActive = activeMasterSubmodule === submodule.key;

                    return (
                      <button
                        key={submodule.key}
                        type="button"
                        onClick={() =>
                          onMasterSubmoduleChange(submodule.key as MasterModuleKey)
                        }
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition ${
                          subActive
                            ? "bg-gold/15 text-gold-dark"
                            : "text-ink/55 hover:bg-gold/10 hover:text-gold-dark"
                        }`}
                      >
                        <SubIcon size={14} />
                        <span className="min-w-0 truncate">{submodule.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
