import { ReactNode, ElementType } from 'react';
import clsx from 'clsx';

export function Container({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={clsx('mx-auto w-full max-w-container px-6 md:px-10', className)}>{children}</Tag>;
}
