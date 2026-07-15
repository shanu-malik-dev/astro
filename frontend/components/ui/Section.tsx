import { ReactNode } from 'react';
import clsx from 'clsx';
import { Container } from './Container';

export function Section({
  children,
  className,
  tone = 'light',
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark' | 'dim';
  id?: string;
}) {
  return (
    <section
      id={id}
      className={clsx(
        'py-20 md:py-28',
        tone === 'dark' && 'bg-ink text-parchment',
        tone === 'dim' && 'bg-parchment-dim',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = 'light',
  align = 'left',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
}) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className={tone === 'dark' ? 'eyebrow-on-dark' : 'eyebrow'}>{eyebrow}</p>}
      <h2 className={clsx('mt-4 text-3xl leading-tight md:text-4xl', tone === 'dark' ? 'text-parchment' : 'text-ink')}>
        {title}
      </h2>
      {description && (
        <p className={clsx('mt-4 text-[15px] leading-relaxed', tone === 'dark' ? 'text-parchment/70' : 'text-ink/65')}>
          {description}
        </p>
      )}
    </div>
  );
}
