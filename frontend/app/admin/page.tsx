"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSnackbarProvider } from "@/components/admin/AdminSnackbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { EnquiryModule } from "@/components/admin/modules/EnquiryModule";
import { FollowUpModule } from "@/components/admin/modules/FollowUpModule";
import { ProblemModule } from "@/components/admin/modules/ProblemModule";
import { ServicesModule } from "@/components/admin/modules/ServicesModule";
import type { ModuleKey } from "@/components/admin/types";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>("problem");
  const isAdmin = Number(user?.role_id) === 1;
  const userName = user?.fullName || user?.name || user?.mobile || "Admin";

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/login?redirect=/admin");
  }, [isAdmin, loading, router]);

  const handleModuleChange = (module: ModuleKey) => {
    setActiveModule(module);
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
    <AdminSnackbarProvider>
      <main className="admin-theme min-h-screen bg-[#f5f0e8] text-ink">
        <div className="flex min-h-screen">
          <AdminSidebar
            activeModule={activeModule}
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

            <div className="p-4 md:p-6">
              {activeModule === "problem" && (
                <ProblemModule />
              )}

              {activeModule === "services" && (
                <ServicesModule />
              )}

              {activeModule === "enquiry" && (
                <EnquiryModule />
              )}

              {activeModule === "followUp" && (
                <FollowUpModule />
              )}
            </div>
          </section>
        </div>
      </main>
    </AdminSnackbarProvider>
  );
}
