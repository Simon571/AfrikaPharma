'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, BarChart3, Home, Settings, LogOut, Users, Package, Warehouse, ArrowUpDown, Tag, Receipt, ChevronUp, ChevronDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface MobileNavigationProps {
  userRole?: 'admin' | 'seller';
}

export function MobileNavigation({ userRole = 'seller' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const sellerLinks = [
    {
      href: '/seller-dashboard',
      label: 'Accueil',
      icon: Home,
    },
    {
      href: '/ventes',
      label: 'Nouvelle Vente',
      icon: ShoppingCart,
    },
    {
      href: '/daily-report',
      label: 'Mon Rapport',
      icon: BarChart3,
    },
  ];

  const adminLinks = [
    {
      href: '/admin-dashboard',
      label: 'Dashboard Admin',
      icon: Home,
    },
    {
      href: '/sell',
      label: 'Vente Rapide',
      icon: ShoppingCart,
    },
    {
      href: '/medications',
      label: 'Médicaments',
      icon: Package,
    },
    {
      href: '/admin/inventory',
      label: 'Inventaire',
      icon: Warehouse,
    },
    {
      href: '/admin/global-report',
      label: 'Rapport Journalier Global',
      icon: BarChart3,
    },
    {
      href: '/admin/stock',
      label: 'Stock',
      icon: Warehouse,
    },
    {
      href: '/stock-movements',
      label: 'Mouvement de Stock',
      icon: ArrowUpDown,
    },
    {
      href: '/admin/produits-disponibles',
      label: 'Produits Disponibles',
      icon: Tag,
    },
    {
      href: '/admin/historique-ventes',
      label: 'Historique Ventes',
      icon: BarChart3,
    },
    {
      href: '/users',
      label: 'Utilisateurs',
      icon: Users,
    },
    {
      href: '/expenses',
      label: 'Gestion des Dépenses',
      icon: Receipt,
    },
    {
      href: '/admin/exchange-rate',
      label: 'Taux de change',
      icon: DollarSign,
    },
  ];

  const links = userRole === 'admin' ? adminLinks : sellerLinks;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Fonction pour gérer le défilement et afficher/masquer l'indicateur
  const handleScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      const scrollPercent = scrollTop / (scrollHeight - clientHeight);
      const isNearBottom = scrollPercent > 0.85; // Considérer proche du bas à 85%
      setShowScrollIndicator(!isNearBottom && scrollHeight > clientHeight);
    }
  };

  // Fonction pour défiler vers le haut ou le bas
  const scrollToPosition = (position: 'top' | 'bottom') => {
    if (navRef.current) {
      const { scrollHeight, clientHeight } = navRef.current;
      const targetPosition = position === 'top' ? 0 : scrollHeight - clientHeight;
      
      navRef.current.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Effet pour ajouter l'écouteur de défilement
  useEffect(() => {
    const navElement = navRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', handleScroll);
      // Vérifier initialement s'il y a du contenu défilable
      handleScroll();
      
      return () => {
        navElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen, userRole]);

  return (
    <div className="lg:hidden">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-white shadow-lg cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-72 p-0 max-w-sm h-screen fixed left-0 top-0 translate-x-0 translate-y-0 rounded-r-lg rounded-l-none overflow-hidden border-none mobile-nav-container">
          <div className="mobile-nav-container">
            {/* Header */}
            <div className="p-6 border-b bg-blue-600 text-white shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">AfrikaPharma</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-blue-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                {userRole === 'admin' ? 'Administration' : 'Point de Vente'}
              </p>
            </div>

            {/* Navigation Links - Scrollable avec curseur visible */}
            <nav ref={navRef} className="mobile-nav-content mobile-nav-scroll relative">
              {/* Indicateur de défilement en haut */}
              {userRole === 'admin' && (
                <div className="text-xs text-center py-3 text-blue-600 scroll-indicator scroll-indicator-top">
                  <div className="flex items-center justify-center gap-2">
                    <span>📋</span>
                    <span className="font-semibold">Modules Administration</span>
                    <span>📋</span>
                  </div>
                  <div className="text-[10px] mt-1 opacity-75">
                    {links.length} modules disponibles - Scroll pour voir tous
                  </div>
                </div>
              )}
              <div className="p-4 pb-20">
                <ul className="space-y-3">
                  {links.map((link, index) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`
                            flex items-center gap-3 px-4 py-4 rounded-lg transition-all duration-200 text-base font-medium cursor-pointer
                            hover:scale-[1.02] active:scale-[0.98] transform
                            ${active 
                              ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                            }
                          `}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: isOpen ? 'slideInFromLeft 0.3s ease-out forwards' : 'none'
                          }}
                        >
                          <Icon className={`h-6 w-6 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="flex-1">{link.label}</span>
                          {active && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                
                {/* Message de fin pour s'assurer qu'on voit tous les modules */}
                {userRole === 'admin' && (
                  <div className="text-center py-4 text-xs text-gray-500 border-t mt-4">
                    ✅ Fin de la liste - {links.length} modules affichés
                  </div>
                )}
              </div>
              
              {/* Indicateur de plus de contenu en bas */}
              {userRole === 'admin' && showScrollIndicator && (
                <div className="text-xs text-center py-3 text-blue-600 scroll-indicator scroll-indicator-bottom">
                  <div className="flex items-center justify-center gap-2">
                    <span>⬇️</span>
                    <span className="font-semibold">Plus de modules en bas</span>
                    <span>⬇️</span>
                  </div>
                  <div className="text-[10px] mt-1 opacity-75">
                    Continuez à faire défiler
                  </div>
                </div>
              )}

              {/* Boutons de navigation rapide (seulement pour admin avec beaucoup de modules) */}
              {userRole === 'admin' && links.length > 6 && (
                <div className="fixed right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 bg-white/90 hover:bg-white shadow-lg border-blue-200"
                    onClick={() => scrollToPosition('top')}
                  >
                    <ChevronUp className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 bg-white/90 hover:bg-white shadow-lg border-blue-200"
                    onClick={() => scrollToPosition('bottom')}
                  >
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              )}
            </nav>

            {/* Quick Actions for Seller */}
            {userRole === 'seller' && (
              <div className="p-4 border-t bg-gray-50 shrink-0">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Actions Rapides</h3>
                <div className="space-y-2">
                  <Link
                    href="/ventes"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Nouvelle Vente
                  </Link>
                </div>
              </div>
            )}

            {/* Section Déconnexion */}
            <div className="p-4 border-t bg-gray-50 shrink-0">
              <div className="space-y-2">
                <Link
                  href="/login-common"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </Link>
                <p className="text-xs text-center text-gray-500">
                  Retour à la page de connexion
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MobileNavigation;