'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Section } from '@/components/ui/Section';
import { useTenant } from '@/lib/tenant-context';
import { blogApi } from '@/lib/api';

export default function BlogPage() {
  const { tenant } = useTenant();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog-all', tenant.id],
    queryFn: () => blogApi.listPublished(tenant.id),
  });

  return (
    <>
      <Section tone="dark" className="pb-14 pt-20">
        <p className="eyebrow-on-dark">Journal</p>
        <h1 className="mt-5 max-w-xl text-4xl leading-tight md:text-5xl">Notes on astrology, timing, and decisions.</h1>
      </Section>

      <Section>
        {isLoading && <p className="text-sm text-ink/50">Loading articles…</p>}
        {isError && <p className="text-sm text-ink/50">Articles will appear here once the backend API is running.</p>}

        {data && data.length > 0 && (
          <div className="grid gap-10 md:grid-cols-2">
            {data.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group border-b border-mist pb-8">
                {post.category && <p className="eyebrow">{post.category}</p>}
                <h2 className="mt-3 text-2xl leading-snug text-ink group-hover:text-wine">{post.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>
                {post.publishedAt && (
                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink/40">
                    {new Date(post.publishedAt).toLocaleDateString(tenant.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {data && data.length === 0 && <p className="text-sm text-ink/50">No articles published yet.</p>}
      </Section>
    </>
  );
}
