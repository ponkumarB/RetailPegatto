'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface NavLinkProps {
  to: string;
  children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
  className?: string | ((props: { isActive: boolean }) => string);
  onClick?: () => void;
  exact?: boolean;
  style?: React.CSSProperties | ((props: { isActive: boolean }) => React.CSSProperties);
  title?: string;
}

export function NavLink({ to, children, className, onClick, exact, style, title }: NavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Match path exactly or starting with, considering query parameters
  const getIsActive = () => {
    const [toPath, toQuery] = to.split('?');
    const isPathMatch = exact
      ? pathname === toPath
      : (toPath === '/' ? pathname === '/' : (pathname === toPath || pathname.startsWith(toPath + '/')));

    if (!isPathMatch) return false;
    if (!toQuery) return true;

    // Compare query parameters
    const toParams = new URLSearchParams(toQuery);
    for (const [key, value] of toParams.entries()) {
      if (searchParams.get(key) !== value) {
        return false;
      }
    }
    return true;
  };

  const isActive = getIsActive();

  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children;
  const resolvedStyle = typeof style === 'function' ? style({ isActive }) : style;

  return (
    <Link href={to} prefetch={false} className={resolvedClass} onClick={onClick} style={resolvedStyle} title={title}>
      {resolvedChildren}
    </Link>
  );
}

