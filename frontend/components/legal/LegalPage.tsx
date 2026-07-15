import { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Section className="pt-20">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-4 text-3xl md:text-4xl">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-ink/40">Last updated {updated}</p>
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-ink/70">{children}</div>
      </div>
    </Section>
  );
}
