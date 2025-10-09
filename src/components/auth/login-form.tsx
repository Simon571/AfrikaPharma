'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Package, ArrowLeft } from 'lucide-react';
import { LoginParticles } from '@/components/ui/login-particles';

interface LoginFormProps {
  role: 'admin' | 'seller';
}

export function LoginForm({ role }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
      role,
    });

    if (result?.ok) {
      if (role === 'admin') {
        router.push('/admin-dashboard');
      } else if (role === 'seller') {
        router.push('/seller-dashboard');
      }
    } else {
      toast.error(`Nom d'utilisateur ou mot de passe incorrect.`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-6 relative overflow-hidden">
      <LoginParticles />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-3xl animate-in fade-in slide-in-from-bottom-4">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-blue-600">PajoPharma</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion</h2>
            <p className="text-gray-600">Entrez vos identifiants pour accéder à votre session</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="votre.email@pajopharma.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={() => router.push('/')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
