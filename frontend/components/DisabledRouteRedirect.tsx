"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullPageLoader } from "@/components/ui/FullPageLoader";

export function DisabledRouteRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return <FullPageLoader message="Please wait..." />;
}
