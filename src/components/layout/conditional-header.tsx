'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from './header';

export function ConditionalHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Pages où la sidebar sera affichée (donc pas de header global)
  const excludedPaths = ['/', '/login-admin', '/login-seller', '/login-common'];
  const shouldShowHeader = !session || status !== 'authenticated' || excludedPaths.includes(pathname);

  if (shouldShowHeader) {
    return <Header />;
  }

  return null;
}