"use client";

import { useQuery } from "@tanstack/react-query";
import { LegalPage } from "@/components/legal/LegalPage";
import { siteContentApi } from "@/lib/api";
import { useTenant } from "@/lib/tenant-context";

const fallbackContent = "";

function renderLegalText(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block, index) => {
      const text = block.trim();
      if (!text) return null;

      if (text.startsWith("## ")) {
        return (
          <h2 key={index} className="pt-2 text-lg text-ink">
            {text.replace(/^##\s+/, "")}
          </h2>
        );
      }

      return <p key={index}>{text}</p>;
    });
}

export function DynamicLegalContent({
  title,
  updatedKey,
  contentKey,
  fallbackUpdated,
  fallback,
}: {
  title: string;
  updatedKey: string;
  contentKey: string;
  fallbackUpdated: string;
  fallback: string;
}) {
  const { tenant } = useTenant();
  const { data } = useQuery({
    queryKey: ["site-content", tenant.id],
    queryFn: () => siteContentApi.public(tenant.id),
  });
  const values = data?.data || {};
  const updated = values[updatedKey] || fallbackUpdated;
  const content = values[contentKey] || fallback || fallbackContent;

  return (
    <LegalPage title={title} updated={updated}>
      {renderLegalText(content)}
    </LegalPage>
  );
}
