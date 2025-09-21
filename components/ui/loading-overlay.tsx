'use client';

import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

export function LoadingOverlay({ 
  message = "Cargando...", 
  size = 'lg',
  fullScreen = true 
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16', 
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 min-h-screen flex items-center justify-center z-50"
    : "flex items-center justify-center";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-purple-600 mx-auto ${sizeClasses[size]}`}></div>
        {mounted && message && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}
