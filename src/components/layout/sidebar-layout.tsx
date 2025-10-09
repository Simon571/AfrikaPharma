'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Package, ShoppingCart, Users, LogOut, Boxes, Tag, Receipt, ArrowUpDown, BarChart3, Warehouse } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useSmartSignOut } from '@/hooks/use-smart-signout';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen] = useState(true);
  const smartSignOut = useSmartSignOut();

  const isAdmin = session?.user?.role === 'admin';
  const isSeller = session?.user?.role === 'seller';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg p-4 transition-all duration-300 ease-in-out overflow-y-auto z-10 hidden lg:block",
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="text-2xl font-bold mb-6 text-white">PAJO PHARMA</div>
        <nav className="space-y-2">
          {isAdmin && (
            <Link
              href="/admin-dashboard"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/admin-dashboard' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard Admin
            </Link>
          )}
          {isSeller && (
            <Link
              href="/seller-dashboard"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/seller-dashboard' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard Vendeur
            </Link>
          )}
          
          {isAdmin && (
            <Link
              href="/sell"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/sell' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
              Vente Rapide
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/medications"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/medications' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Package className="mr-3 h-5 w-5" />
              Médicaments
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/inventory"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/admin/inventory' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Warehouse className="mr-3 h-5 w-5" />
              Inventaire
            </Link>
          )}
          {isSeller && (
            <Link
              href="/ventes"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/ventes' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
              Ventes
            </Link>
          )}
          {isSeller && (
            <Link
              href="/daily-report"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/daily-report' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Rapport Journalier
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/global-report"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/admin/global-report' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Rapport Journalier Global
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/stock"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/admin/stock' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Boxes className="mr-3 h-5 w-5" />
              Stock
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/stock-movements"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/stock-movements' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <ArrowUpDown className="mr-3 h-5 w-5" />
              Mouvement de Stock
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/produits-disponibles"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/admin/produits-disponibles' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Tag className="mr-3 h-5 w-5" />
              Produits Disponibles
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/sales"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/sales' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
              Historique Ventes
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/users"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/users' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Users className="mr-3 h-5 w-5" />
              Utilisateurs
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/expenses"
              className={cn(
                "flex items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors",
                pathname === '/expenses' && 'bg-white/30 text-white font-semibold'
              )}
            >
              <Receipt className="mr-3 h-5 w-5" />
              Gestion des Dépenses
            </Link>
          )}
          {session && (
            <Button
              onClick={smartSignOut}
              className={cn(
                "w-full flex items-center p-2 rounded-md text-white hover:bg-red-600 justify-start transition-colors mt-4",
                "bg-red-500 hover:bg-red-600 text-white border-none shadow-lg"
              )}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Déconnexion
            </Button>
          )}
        </nav>
      </aside>
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out min-h-screen",
        isSidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        <div className="p-2 sm:p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
