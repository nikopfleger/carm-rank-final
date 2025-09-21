'use client';

import { useGlobalErrorBoundary } from '@/hooks/use-global-error-boundary';
import { ReactNode } from 'react';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  useGlobalErrorBoundary();
  return <>{children}</>;
}
