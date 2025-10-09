'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import SidebarLayout from './sidebar-layout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Pages où la sidebar ne doit PAS être affichée
  const excludedPaths = ['/', '/login-admin', '/login-seller', '/login-common'];
  const shouldShowSidebar = session && status === 'authenticated' && !excludedPaths.includes(pathname);

  if (shouldShowSidebar) {
    return (
      <div className="min-h-screen">
        <SidebarLayout>{children}</SidebarLayout>
      </div>
    );
  }

  // Pages sans sidebar (accueil, connexion)
  return <main>{children}</main>;
}