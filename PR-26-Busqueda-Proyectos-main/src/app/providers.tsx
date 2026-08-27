/* ============================================================================
 * src/app/providers.tsx
 * Providers globales de la aplicación (Anexo B2): TanStack Query, tema,
 * estado global (bridge) y notificaciones.
 * ========================================================================= */

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AnimatedBackground } from '@/shared/components/AnimatedBackground';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function ConToasterYFondo({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <AppProvider>
      <AnimatedBackground />
      <Toaster position="top-right" offset="80px" richColors theme={theme} />
      {children}
    </AppProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConToasterYFondo>{children}</ConToasterYFondo>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
