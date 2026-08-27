import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { router } from './routes';
import { AnimatedBackground } from './components/AnimatedBackground';

function AppContent() {
  const { theme } = useTheme();

  return (
    <AppProvider>
      <AnimatedBackground />
      <Toaster position="top-right" offset="80px" richColors theme={theme} />
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
