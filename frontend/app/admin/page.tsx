"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSnackbarProvider } from "@/components/admin/AdminSnackbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AstrologersModule } from "@/components/admin/modules/AstrologersModule";
import { CustomersModule } from "@/components/admin/modules/CustomersModule";
import { EnquiryModule } from "@/components/admin/modules/EnquiryModule";
import { FollowUpModule } from "@/components/admin/modules/FollowUpModule";
import { PaymentsModule } from "@/components/admin/modules/PaymentsModule";
import { ProblemModule } from "@/components/admin/modules/ProblemModule";
import { RoleModule } from "@/components/admin/modules/RoleModule";
import { ServicesModule } from "@/components/admin/modules/ServicesModule";
import { SupportModule } from "@/components/admin/modules/SupportModule";
import { MODULES } from "@/components/admin/constants";
import type { ModuleKey } from "@/components/admin/types";
import { useAuth } from "@/lib/auth-context";
import { FullPageLoader } from "@/components/ui/FullPageLoader";

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>(
    MODULES[0]?.key || "problem"
  );
  const permittedModules = useMemo(() => {
    const allowedModuleKeys =
      Number(user?.role_id) === 1
        ? MODULES.map((module) => module.key)
        : user?.admin_modules || [];

    return MODULES.filter((module) => allowedModuleKeys.includes(module.key));
  }, [user?.admin_modules, user?.role_id]);
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

  const handleModuleChange = (module: ModuleKey) => {
    setActiveModule(module);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
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
            sidebarOpen={sidebarOpen}
            onModuleChange={handleModuleChange}
            onToggle={() => setSidebarOpen((open) => !open)}
          />

          <section className="min-w-0 flex-1">
            <AdminHeader
              userName={userName}
              onLogout={handleLogout}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
            />

            <div className="admin-workspace p-4 md:p-6">
              {activeModuleEnabled && activeModule === "problem" && (
                <ProblemModule />
              )}

              {activeModuleEnabled && activeModule === "services" && (
                <ServicesModule />
              )}

              {activeModuleEnabled && activeModule === "astrologers" && (
                <AstrologersModule />
              )}

              {activeModuleEnabled && activeModule === "enquiry" && (
                <EnquiryModule />
              )}

              {activeModuleEnabled && activeModule === "customers" && (
                <CustomersModule />
              )}

              {activeModuleEnabled && activeModule === "followUp" && (
                <FollowUpModule />
              )}

              {activeModuleEnabled && activeModule === "payments" && (
                <PaymentsModule />
              )}

              {activeModuleEnabled && activeModule === "support" && (
                <SupportModule />
              )}

              {activeModuleEnabled && activeModule === "roles" && (
                <RoleModule />
              )}
            </div>
          </section>
        </div>
      </main>
    </AdminSnackbarProvider>
  );
}
