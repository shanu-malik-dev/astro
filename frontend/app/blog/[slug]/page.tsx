'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { useTenant } from '@/lib/tenant-context';
import { blogApi } from '@/lib/api';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { tenant } = useTenant();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog-post', tenant.id, params.slug],
    queryFn: () => blogApi.getBySlug(tenant.id, params.slug),
  });

  return (
    <Section className="pt-16">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink">
        <ArrowLeft size={14} /> Back to Journal
      </Link>

      {isLoading && <p className="mt-8 text-sm text-ink/50">Loading article…</p>}
      {isError && <p className="mt-8 text-sm text-ink/50">This article couldn't be found.</p>}

      {data && (
        <article className="mx-auto mt-8 max-w-2xl">
          {data.category && <p className="eyebrow">{data.category}</p>}
          <h1 className="mt-4 text-3xl leading-tight md:text-4xl">{data.title}</h1>
          {data.publishedAt && (
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink/40">
              {new Date(data.publishedAt).toLocaleDateString(tenant.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
          <div className="mt-10 space-y-5 whitespace-pre-line text-[15px] leading-relaxed text-ink/75">
            {data.content}
          </div>
        </article>
      )}
    </Section>
  );
}
