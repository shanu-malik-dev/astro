"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  Eye,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";
import { useAuth } from "@/lib/auth-context";

type ModuleKey = "problem" | "services" | "profession" | "enquiry";

type Translation = {
  lang: string;
  label: string;
  name: string;
};

type ServiceTranslation = Translation & {
  description: string;
};

type Problem = {
  id: number;
  displayOrder: number;
  status: "active" | "inactive";
  translations: Translation[];
};

type SimpleRow = {
  id: number;
  title: string;
  status: "active" | "inactive" | "new" | "closed";
  meta: string;
};

type ServiceRow = {
  id: number;
  status: "active" | "inactive";
  translations: ServiceTranslation[];
};

type EnquiryStatus = "new" | "in_progress" | "follow_up" | "closed";

type EnquiryRow = {
  enq_id: number;
  customer_name: string;
  customer_number: string;
  problem_name: string;
  status: EnquiryStatus;
  remark?: string;
};

const STORAGE_KEY = "astronova_admin_problems";
const SERVICES_STORAGE_KEY = "astronova_admin_services";
const PAGE_SIZE = 10;
const PROBLEM_LANGUAGES = [
  { lang: "en", label: "English" },
  { lang: "hi", label: "Hindi" },
];
const PROBLEM_STATUS_OPTIONS: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const ENQUIRY_STATUS_OPTIONS: SelectOption[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "follow_up", label: "Follow Up" },
  { value: "closed", label: "Closed" },
];

const MODULES: Array<{
  key: ModuleKey;
  label: string;
  description: string;
  icon: typeof ClipboardList;
}> = [
  {
    key: "problem",
    label: "Problem",
    description: "Create, update, translate, and manage customer problems.",
    icon: ClipboardList,
  },
  {
    key: "services",
    label: "Services",
    description: "Manage service names, descriptions, and status.",
    icon: Settings,
  },
  {
    key: "profession",
    label: "Profession",
    description: "Prepare profession categories and naming workflows.",
    icon: BriefcaseBusiness,
  },
  {
    key: "enquiry",
    label: "Enquiry",
    description: "Review inbound customer enquiries and follow-up status.",
    icon: HelpCircle,
  },
];

const PROFESSIONS: SimpleRow[] = [
  { id: 1, title: "Doctor", status: "active", meta: "Health and medical" },
  { id: 2, title: "Engineer", status: "active", meta: "Technical career" },
  { id: 3, title: "Business Owner", status: "inactive", meta: "Trade and commerce" },
];

const ENQUIRIES: EnquiryRow[] = [
  {
    enq_id: 101,
    customer_name: "Amit Sharma",
    customer_number: "+91 9876543210",
    problem_name: "Marriage consultation",
    status: "new",
  },
  {
    enq_id: 102,
    customer_name: "Priya Singh",
    customer_number: "+91 9123456780",
    problem_name: "Career reading",
    status: "follow_up",
    remark: "Customer asked for evening callback.",
  },
  {
    enq_id: 103,
    customer_name: "Rahul Verma",
    customer_number: "+91 9988776655",
    problem_name: "Payment support",
    status: "closed",
    remark: "Resolved on first call.",
  },
];

function createEmptyTranslations() {
  return PROBLEM_LANGUAGES.map((language) => ({
    lang: language.lang,
    label: language.label,
    name: "",
  }));
}

function createEmptyServiceTranslations() {
  return PROBLEM_LANGUAGES.map((language) => ({
    lang: language.lang,
    label: language.label,
    name: "",
    description: "",
  }));
}

function syncTranslations(problem: Problem): Problem {
  const existing = new Map(
    problem.translations.map((translation) => [
      translation.lang,
      translation,
    ])
  );

  return {
    ...problem,
    translations: PROBLEM_LANGUAGES.map((language) => {
      const current = existing.get(language.lang);

      return {
        lang: language.lang,
        label: language.label,
        name: current?.name || "",
      };
    }),
  };
}

function syncServiceTranslations(service: ServiceRow): ServiceRow {
  const oldService = service as ServiceRow & {
    name?: string;
    description?: string;
  };
  const existing = new Map(
    (service.translations || []).map((translation) => [
      translation.lang,
      translation,
    ])
  );

  return {
    ...service,
    translations: PROBLEM_LANGUAGES.map((language) => {
      const current = existing.get(language.lang);

      return {
        lang: language.lang,
        label: language.label,
        name:
          current?.name ||
          (language.lang === "en" ? oldService.name || "" : ""),
        description:
          current?.description ||
          (language.lang === "en" ? oldService.description || "" : ""),
      };
    }),
  };
}

function getEnglishTranslation<T extends Translation>(translations: T[]) {
  return translations.find((item) => item.lang === "en") || translations[0];
}

function StatusBadge({ status }: { status: string }) {
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

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>("problem");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [draft, setDraft] = useState<Problem | null>(null);
  const isAdmin = Number(user?.role_id) === 1;
  const userName = user?.fullName || user?.name || user?.mobile || "Admin";

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/login?redirect=/admin");
  }, [isAdmin, loading, router]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      setProblems(JSON.parse(raw));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    const raw = window.localStorage.getItem(SERVICES_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsedServices = JSON.parse(raw) as ServiceRow[];
      setServices(parsedServices.map(syncServiceTranslations));
    } catch {
      window.localStorage.removeItem(SERVICES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  const totalPages = Math.max(1, Math.ceil(problems.length / PAGE_SIZE));
  const paginatedProblems = useMemo(
    () =>
      problems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [currentPage, problems]
  );

  const startCreate = () => {
    const nextId = Math.max(0, ...problems.map((problem) => problem.id)) + 1;
    setDraft({
      id: nextId,
      displayOrder: problems.length + 1,
      status: "active",
      translations: createEmptyTranslations(),
    });
  };

  const startEdit = (problem: Problem) => {
    setDraft(syncTranslations(problem));
  };

  const saveDraft = () => {
    if (!draft) return;

    setProblems((current) => {
      const exists = current.some((problem) => problem.id === draft.id);
      if (exists) {
        return current.map((problem) =>
          problem.id === draft.id ? draft : problem
        );
      }
      return [...current, draft];
    });
    setDraft(null);
  };

  const deleteProblem = (problemId: number) => {
    setProblems((current) =>
      current.filter((problem) => problem.id !== problemId)
    );
    if (draft?.id === problemId) setDraft(null);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading || !isAdmin) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] p-8">
        <p className="text-sm text-ink/60">Checking admin access...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-ink">
      <div className="flex min-h-screen">
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
              onClick={() => setSidebarOpen((open) => !open)}
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
                  onClick={() => {
                    setActiveModule(module.key);
                    setDraft(null);
                  }}
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

          <div className="mt-auto px-3 py-5">
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink/65 hover:bg-parchment hover:text-ink">
              <LayoutDashboard size={17} />
              {sidebarOpen && <span>Dashboard</span>}
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-mist bg-white px-5">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-md border border-mist p-2 text-ink/70 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>

            <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-mist bg-parchment px-3 py-2 text-sm text-ink/45 md:flex">
              <Search size={16} />
              <span>Search here</span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button className="rounded-full border border-mist p-2 text-ink/60 hover:text-ink" aria-label="Notifications">
                <Bell size={17} />
              </button>
              <button className="rounded-full border border-mist p-2 text-ink/60 hover:text-ink" aria-label="Settings">
                <Settings size={17} />
              </button>
              <div className="flex items-center gap-2 rounded-full border border-mist px-3 py-1.5">
                <UserCircle size={20} className="text-gold" />
                <span className="max-w-36 truncate text-sm font-medium">{userName}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-mist p-2 text-ink/60 hover:bg-red-50 hover:text-red-600"
                aria-label="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          </header>

          <div className="p-4 md:p-6">
            {activeModule === "problem" && (
              <ProblemModule
                problems={problems}
                paginatedProblems={paginatedProblems}
                currentPage={currentPage}
                totalPages={totalPages}
                draft={draft}
                setCurrentPage={setCurrentPage}
                setDraft={setDraft}
                startCreate={startCreate}
                startEdit={startEdit}
                saveDraft={saveDraft}
                deleteProblem={deleteProblem}
              />
            )}

            {activeModule === "services" && (
              <ServicesModule services={services} setServices={setServices} />
            )}

            {activeModule === "profession" && (
              <SimpleModule
                eyebrow="Admin"
                title="Profession Module"
                description="Profession UI is ready for listing and management workflows."
                rows={PROFESSIONS}
                createLabel="Create Profession"
              />
            )}

            {activeModule === "enquiry" && (
              <EnquiryModule enquiries={ENQUIRIES} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProblemModule({
  problems,
  paginatedProblems,
  currentPage,
  totalPages,
  draft,
  setCurrentPage,
  setDraft,
  startCreate,
  startEdit,
  saveDraft,
  deleteProblem,
}: {
  problems: Problem[];
  paginatedProblems: Problem[];
  currentPage: number;
  totalPages: number;
  draft: Problem | null;
  setCurrentPage: (page: number) => void;
  setDraft: (draft: Problem | null) => void;
  startCreate: () => void;
  startEdit: (problem: Problem) => void;
  saveDraft: () => void;
  deleteProblem: (problemId: number) => void;
}) {
  const [viewingProblem, setViewingProblem] = useState<Problem | null>(null);

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Problem Module"
        onCreate={startCreate}
        createLabel="Create Problem"
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Problem Listing</h2>
            <p className="text-[11px] text-ink/50">
              {problems.length} total records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-36 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-mist">
              {paginatedProblems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-5 text-sm text-ink/50">
                    No problems yet. Create the first problem.
                  </td>
                </tr>
              ) : (
                paginatedProblems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="text-sm transition hover:bg-parchment/55"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{problem.id.toString().padStart(3, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-ink">
                        {problem.translations.find((item) => item.lang === "en")?.name ||
                          "Untitled problem"}
                      </p>
                      <p className="text-[11px] text-ink/45">
                        Order {problem.displayOrder}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={problem.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingProblem(syncTranslations(problem))}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="View problem names"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(problem)}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="Edit problem"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProblem(problem.id)}
                          className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                          aria-label="Delete problem"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Problem Details</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {problems.some((problem) => problem.id === draft.id) ? "Edit Problem" : "Create Problem"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close problem form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-76px)] overflow-y-auto">
              <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
                <div className="border-b border-mist p-5 lg:border-b-0 lg:border-r">
                  <h3 className="font-semibold text-ink">Settings</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/55">
                    Control ordering and visibility for this problem.
                  </p>

                  <div className="mt-5 space-y-4">
                    <label className="block text-sm font-medium text-ink">
                      Display order
                      <input
                        type="number"
                        value={draft.displayOrder}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            displayOrder: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                      />
                    </label>

                    <label className="block text-sm font-medium text-ink">
                      Status
                      <CustomSelect
                        instanceId="problem-status"
                        options={PROBLEM_STATUS_OPTIONS}
                        value={
                          PROBLEM_STATUS_OPTIONS.find(
                            (option) => option.value === draft.status
                          ) || null
                        }
                        variant="light"
                        onChange={(option) => {
                          if (!option) return;
                          setDraft({
                            ...draft,
                            status: option.value as Problem["status"],
                          });
                        }}
                        className="mt-2"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-ink">Problem Names</h3>
                      <p className="mt-1 text-sm leading-6 text-ink/55">
                        Add language-wise names. Currently English and Hindi are enabled.
                      </p>
                    </div>
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                      {draft.translations.length} Languages
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {draft.translations.map((translation, index) => (
                      <label
                        key={translation.lang}
                        className="rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink"
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>Name {translation.label}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                            {translation.lang}
                          </span>
                        </span>
                        <input
                          type="text"
                          value={translation.name}
                          onChange={(event) => {
                            const translations = [...draft.translations];
                            translations[index] = {
                              ...translation,
                              name: event.target.value,
                            };
                            setDraft({ ...draft, translations });
                          }}
                          placeholder={`Enter ${translation.label} name`}
                          className="mt-3 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
                >
                  <Save size={16} />
                  Save Problem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingProblem && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Problem Names</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {viewingProblem.translations.find((item) => item.lang === "en")?.name || "Untitled problem"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingProblem(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close problem names"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {viewingProblem.translations.map((translation) => (
                <div
                  key={translation.lang}
                  className="rounded-md border border-mist bg-parchment p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      Name {translation.label}
                    </p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                      {translation.lang}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">
                    {translation.name || "Not added"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ServicesModule({
  services,
  setServices,
}: {
  services: ServiceRow[];
  setServices: Dispatch<SetStateAction<ServiceRow[]>>;
}) {
  const [draft, setDraft] = useState<ServiceRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(services.length / PAGE_SIZE));
  const paginatedServices = useMemo(
    () =>
      services.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [currentPage, services]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startCreate = () => {
    const nextId = Math.max(0, ...services.map((service) => service.id)) + 1;
    setDraft({
      id: nextId,
      status: "active",
      translations: createEmptyServiceTranslations(),
    });
  };

  const saveDraft = () => {
    if (!draft) return;

    setServices((current) => {
      const exists = current.some((service) => service.id === draft.id);
      if (exists) {
        return current.map((service) =>
          service.id === draft.id ? draft : service
        );
      }
      return [...current, draft];
    });
    setDraft(null);
  };

  const deleteService = (serviceId: number) => {
    setServices((current) =>
      current.filter((service) => service.id !== serviceId)
    );
    if (draft?.id === serviceId) setDraft(null);
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Services Module"
        createLabel="Create Service"
        onCreate={startCreate}
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Service Listing</h2>
            <p className="text-[11px] text-ink/50">{services.length} total records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold">Description</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-28 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm text-ink/50">
                    No services yet. Create the first service.
                  </td>
                </tr>
              ) : (
                paginatedServices.map((service) => {
                  const english = getEnglishTranslation(
                    syncServiceTranslations(service).translations
                  );

                  return (
                    <tr key={service.id} className="text-sm transition hover:bg-parchment/55">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                        #{service.id.toString().padStart(3, "0")}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-ink">
                        {english?.name || "Untitled service"}
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        <span className="line-clamp-1">
                          {english?.description || "No description"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDraft(syncServiceTranslations(service))}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Edit service"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteService(service.id)}
                            className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                            aria-label="Delete service"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Service Details</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {services.some((service) => service.id === draft.id) ? "Edit Service" : "Create Service"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close service form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block text-sm font-medium text-ink">
                Status
                <CustomSelect
                  instanceId="service-status"
                  options={PROBLEM_STATUS_OPTIONS}
                  value={
                    PROBLEM_STATUS_OPTIONS.find(
                      (option) => option.value === draft.status
                    ) || null
                  }
                  variant="light"
                  onChange={(option) => {
                    if (!option) return;
                    setDraft({
                      ...draft,
                      status: option.value as ServiceRow["status"],
                    });
                  }}
                  className="mt-2"
                />
              </label>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Service Content</h3>
                    <p className="mt-1 text-xs text-ink/55">
                      Add language-wise name and description.
                    </p>
                  </div>
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                    {draft.translations.length} Languages
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {draft.translations.map((translation, index) => (
                    <div
                      key={translation.lang}
                      className="rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{translation.label}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                          {translation.lang}
                        </span>
                      </div>

                      <label className="mt-4 block">
                        Name
                        <input
                          type="text"
                          value={translation.name}
                          onChange={(event) => {
                            const translations = [...draft.translations];
                            translations[index] = {
                              ...translation,
                              name: event.target.value,
                            };
                            setDraft({ ...draft, translations });
                          }}
                          className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                          placeholder={`Enter ${translation.label} name`}
                        />
                      </label>

                      <label className="mt-4 block">
                        Description
                        <textarea
                          value={translation.description}
                          onChange={(event) => {
                            const translations = [...draft.translations];
                            translations[index] = {
                              ...translation,
                              description: event.target.value,
                            };
                            setDraft({ ...draft, translations });
                          }}
                          rows={3}
                          className="mt-2 w-full resize-none rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                          placeholder={`Enter ${translation.label} description`}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
              >
                <Save size={16} />
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EnquiryModule({ enquiries }: { enquiries: EnquiryRow[] }) {
  const [rows, setRows] = useState(enquiries);
  const [currentPage, setCurrentPage] = useState(1);
  const [followDraft, setFollowDraft] = useState<EnquiryRow | null>(null);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () =>
      rows.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [currentPage, rows]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const saveFollowUp = () => {
    if (!followDraft) return;

    setRows((current) =>
      current.map((row) =>
        row.enq_id === followDraft.enq_id ? followDraft : row
      )
    );
    setFollowDraft(null);
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.35em] text-gold-dark">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            Enquiry Module
          </h1>
        </div>
        <div className="rounded-md border border-mist bg-white px-4 py-2 text-sm text-ink/60">
          {rows.length} total enquiries
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Enquiry Listing</h2>
            <p className="text-[11px] text-ink/50">
              Follow customer enquiries and update status.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">Enq ID</th>
                <th className="w-48 px-4 py-2.5 font-semibold">Customer</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Number</th>
                <th className="px-4 py-2.5 font-semibold">Problem</th>
                <th className="w-36 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-40 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-sm text-ink/50">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((enquiry) => (
                  <tr key={enquiry.enq_id} className="text-sm transition hover:bg-parchment/55">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{enquiry.enq_id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{enquiry.customer_name}</p>
                      {enquiry.remark && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-ink/45">
                          {enquiry.remark}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink/65">
                      {enquiry.customer_number}
                    </td>
                    <td className="px-4 py-2.5 text-ink/70">
                      {enquiry.problem_name}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={enquiry.status.replace("_", " ")} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`tel:${enquiry.customer_number.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-mist bg-white px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                        >
                          <Phone size={14} />
                          Call
                        </a>
                        <button
                          type="button"
                          onClick={() => setFollowDraft(enquiry)}
                          className="rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                        >
                          Follow
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {followDraft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
                  Follow Up
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {followDraft.customer_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFollowDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close follow up"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 rounded-md border border-mist bg-parchment p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Customer Number</p>
                  <p className="mt-1 font-medium text-ink">{followDraft.customer_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Problem</p>
                  <p className="mt-1 font-medium text-ink">{followDraft.problem_name}</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-ink">
                Status
                <CustomSelect
                  instanceId="enquiry-follow-status"
                  options={ENQUIRY_STATUS_OPTIONS}
                  value={
                    ENQUIRY_STATUS_OPTIONS.find(
                      (option) => option.value === followDraft.status
                    ) || null
                  }
                  variant="light"
                  onChange={(option) => {
                    if (!option) return;
                    setFollowDraft({
                      ...followDraft,
                      status: option.value as EnquiryStatus,
                    });
                  }}
                  className="mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Remark
                <textarea
                  value={followDraft.remark || ""}
                  onChange={(event) =>
                    setFollowDraft({
                      ...followDraft,
                      remark: event.target.value,
                    })
                  }
                  rows={4}
                  className="mt-2 w-full resize-none rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                  placeholder="Enter follow-up remark"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => setFollowDraft(null)}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFollowUp}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
              >
                <Save size={16} />
                Save Follow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModuleHeader({
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
        className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
      >
        <Plus size={17} />
        {createLabel}
      </button>
    </div>
  );
}

function SimpleModule({
  eyebrow,
  title,
  description,
  rows,
  createLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  rows: SimpleRow[];
  createLabel: string;
}) {
  return (
    <>
      <ModuleHeader
        eyebrow={eyebrow}
        title={title}
        createLabel={createLabel}
        onCreate={() => undefined}
      />

      <p className="mt-3 max-w-2xl text-sm text-ink/60">{description}</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="grid grid-cols-[80px_1fr_160px_120px] border-b border-mist bg-parchment px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink/60">
          <span>ID</span>
          <span>Name</span>
          <span>Meta</span>
          <span>Status</span>
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[80px_1fr_160px_120px] items-center border-b border-mist px-4 py-3 text-sm last:border-b-0"
          >
            <span>{row.id}</span>
            <span className="font-medium text-ink">{row.title}</span>
            <span className="text-ink/60">{row.meta}</span>
            <StatusBadge status={row.status} />
          </div>
        ))}
      </div>
    </>
  );
}

function Pagination({
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
