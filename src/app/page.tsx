'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Brain } from 'lucide-react';
import { ConnectDropdown } from '@/components/ui/connect-dropdown';
import { FadeIn } from '@/components/ui/fade-in';
import { ParticleBackground } from '@/components/ui/particle-background';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 relative overflow-hidden">
      <ParticleBackground />
      {/* Header */}
      <header className="flex items-center justify-between p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">PajoPharma</h1>
        </div>
        <ConnectDropdown />
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-20 text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Le futur de la gestion de<br />
          pharmacie est arrivé
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 max-w-4xl leading-relaxed text-blue-100">
          PajoPharma est un système complet pour gérer votre stock, accélérer vos ventes et<br />
          optimiser vos commandes grâce à l'intelligence artificielle.
        </p>

        <Button 
          onClick={() => router.push("/login-admin")}
          className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
        >
          Commencez maintenant
        </Button>
        
        {/* Statistics */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-4xl font-bold mb-2">500+</div>
            <p className="text-blue-100">Pharmacies connectées</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-4xl font-bold mb-2">1M+</div>
            <p className="text-blue-100">Ventes traitées</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-4xl font-bold mb-2">99.9%</div>
            <p className="text-blue-100">Temps de disponibilité</p>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            
            {/* Feature 1: Gestion de stock */}
            <FadeIn delay={100} direction="up">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Gestion de stock simplifiée
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Suivez votre inventaire en temps réel, ajoutez de nouveaux produits et gérez les dates d'expiration sans effort.
                </p>
              </div>
            </FadeIn>

            {/* Feature 2: Terminal de vente */}
            <FadeIn delay={300} direction="up">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Terminal de vente rapide
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Un système de caisse intuitif qui gère les différents formats de vente (boîte, plaquette, unité) et génère des factures.
                </p>
              </div>
            </FadeIn>

            {/* Feature 3: Commandes intelligentes */}
            <FadeIn delay={500} direction="up">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Commandes intelligentes
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Laissez notre IA analyser vos tendances de vente pour vous suggérer les quantités optimales à commander et éviter les ruptures.
                </p>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 text-center text-gray-600">
        <p>© 2025 PajoPharma. Tous droits réservés.</p>
      </footer>
    </div>
  );
}