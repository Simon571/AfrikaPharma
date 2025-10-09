'use client';

import Link from 'next/link';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function FloatingActionButton({ 
  href = '/ventes', 
  onClick, 
  className = '' 
}: FloatingActionButtonProps) {
  const buttonContent = (
    <Button
      size="lg"
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg
        bg-blue-600 hover:bg-blue-700 text-white
        border-4 border-white
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        ${className}
      `}
    >
      <ShoppingCart className="h-8 w-8" />
    </Button>
  );

  if (href && !onClick) {
    return (
      <Link href={href}>
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
}

export default FloatingActionButton;