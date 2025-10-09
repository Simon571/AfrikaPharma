'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronDown, Shield, Users, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ConnectDropdown() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2">
          <span>Se connecter</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border shadow-lg rounded-lg">
        <DropdownMenuItem 
          onClick={() => router.push("/login-admin")}
          className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Administrateur</p>
            <p className="text-sm text-gray-500">Gestion complète</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => router.push("/login-seller")}
          className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
        >
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Vendeur</p>
            <p className="text-sm text-gray-500">Interface de vente</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}