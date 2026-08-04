"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSnackbarProvider } from "@/components/admin/AdminSnackbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CustomersModule } from "@/components/admin/modules/CustomersModule";
import { DashboardModule } from "@/components/admin/modules/DashboardModule";
import { EnquiryModule } from "@/components/admin/modules/EnquiryModule";
import { FollowUpModule } from "@/components/admin/modules/FollowUpModule";
import { MasterModule } from "@/components/admin/modules/MasterModule";
import { PaymentsModule } from "@/components/admin/modules/PaymentsModule";
import { SupportModule } from "@/components/admin/modules/SupportModule";
import { ALL_MODULES, MASTER_MODULE_KEYS, SIDEBAR_MODULES } from "@/components/admin/constants";
import type { AdminDateFilter, MasterModuleKey, ModuleKey } from "@/components/admin/types";
import { useAuth } from "@/lib/auth-context";
import { FullPageLoader } from "@/components/ui/FullPageLoader";

export default function AdminPage() {
  const { user, accessToken, loading, logout, syncCurrentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userSynced, setUserSynced] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey>(
    SIDEBAR_MODULES[0]?.key || "dashboard"
  );
  const [dashboardFilter, setDashboardFilter] =
    useState<AdminDateFilter | null>(null);
  const [masterSubmodule, setMasterSubmodule] =
    useState<MasterModuleKey | null>(null);
  const [filterToken, setFilterToken] = useState(0);
  const allowedModuleKeys = useMemo(() => {
    if (Number(user?.role_id) === 1) {
      return SIDEBAR_MODULES.map((module) => module.key).concat(
        MASTER_MODULE_KEYS
      );
    }

    const modules = user?.admin_modules || [];
    return modules.includes("users") && !modules.includes("customers")
      ? modules.concat("customers")
      : modules;
  }, [user?.admin_modules, user?.role_id]);
  const permittedModules = useMemo(() => {
    return SIDEBAR_MODULES.filter((module) => {
      if (module.key === "master") {
        return (
          allowedModuleKeys.includes("master") ||
          MASTER_MODULE_KEYS.some((key) => allowedModuleKeys.includes(key))
        );
      }

      return allowedModuleKeys.includes(module.key);
    });
  }, [allowedModuleKeys]);
  const permittedMasterModules = useMemo(
    () =>
      MASTER_MODULE_KEYS.map((key) =>
        ALL_MODULES.find((module) => module.key === key)
      ).filter(
        (module): module is NonNullable<typeof module> =>
          Boolean(module && allowedModuleKeys.includes(module.key))
      ),
    [allowedModuleKeys]
  );
  const isAdmin = permittedModules.length > 0;
  const userName = user?.fullName || user?.name || user?.mobile || "Admin";
  const activeModuleEnabled = permittedModules.some(
    (module) => module.key === activeModule
  );

  useEffect(() => {
    if (!activeModuleEnabled && permittedModules[0]) {
      setActiveModule(permittedModules[0].key);
    }
  }, [activeModuleEnabled, permittedModules]);

  useEffect(() => {
    if (!masterSubmodule) return;
    if (!allowedModuleKeys.includes(masterSubmodule)) {
      setMasterSubmodule(null);
    }
  }, [allowedModuleKeys, masterSubmodule]);

  useEffect(() => {
    const syncSidebar = () => setSidebarOpen(window.innerWidth >= 1024);

    syncSidebar();
    window.addEventListener("resize", syncSidebar);

    return () => window.removeEventListener("resize", syncSidebar);
  }, []);

  useEffect(() => {
    let active = true;

    async function syncUserModules() {
      if (!accessToken) {
        setUserSynced(true);
        return;
      }

      setUserSynced(false);
      try {
        await syncCurrentUser();
      } finally {
        if (active) setUserSynced(true);
      }
    }

    syncUserModules();

    return () => {
      active = false;
    };
  }, [accessToken, syncCurrentUser]);

  const handleModuleChange = (module: ModuleKey) => {
    setActiveModule(module);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleMasterSubmoduleChange = (module: MasterModuleKey) => {
    setMasterSubmodule(module);
    setActiveModule("master");
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const navigateWithFilter = (
    module: ModuleKey,
    filter: AdminDateFilter,
    submodule?: MasterModuleKey
  ) => {
    setDashboardFilter(filter);
    if (submodule) setMasterSubmodule(submodule);
    setFilterToken((current) => current + 1);
    setActiveModule(module);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading || !userSynced) {
    return (
      <FullPageLoader message="Checking admin access..." />
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <AdminSnackbarProvider>
      <main className="admin-theme min-h-screen bg-[#eef4f8] text-ink">
        <div className="flex min-h-screen">
          <AdminSidebar
            activeModule={activeModule}
            modules={permittedModules}
            masterModules={permittedMasterModules}
            sidebarOpen={sidebarOpen}
            activeMasterSubmodule={masterSubmodule}
            onModuleChange={handleModuleChange}
            onMasterSubmoduleChange={handleMasterSubmoduleChange}
            onToggle={() => setSidebarOpen((open) => !open)}
          />

          <section
            className={`min-w-0 flex-1 transition-[margin] duration-300 ${
              sidebarOpen ? "lg:ml-64" : "lg:ml-20"
            }`}
          >
            <AdminHeader
              userName={userName}
              onLogout={handleLogout}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
            />

            <div className="admin-workspace p-4 md:p-6">
              {activeModuleEnabled && activeModule === "dashboard" && (
                <DashboardModule onNavigate={navigateWithFilter} />
              )}

              {activeModuleEnabled && activeModule === "master" && (
                <MasterModule
                  activeSubmodule={masterSubmodule}
                  userFilter={dashboardFilter}
                  filterToken={filterToken}
                />
              )}

              {activeModuleEnabled && activeModule === "enquiry" && (
                <EnquiryModule
                  initialDateFilter={dashboardFilter}
                  filterToken={filterToken}
                />
              )}

              {activeModuleEnabled && activeModule === "followUp" && (
                <FollowUpModule
                  initialDateFilter={dashboardFilter}
                  filterToken={filterToken}
                />
              )}

              {activeModuleEnabled && activeModule === "customers" && (
                <CustomersModule
                  initialDateFilter={dashboardFilter}
                  filterToken={filterToken}
                />
              )}

              {activeModuleEnabled && activeModule === "payments" && (
                <PaymentsModule />
              )}

              {activeModuleEnabled && activeModule === "support" && (
                <SupportModule />
              )}
            </div>
          </section>
        </div>
      </main>
    </AdminSnackbarProvider>
  );
}
