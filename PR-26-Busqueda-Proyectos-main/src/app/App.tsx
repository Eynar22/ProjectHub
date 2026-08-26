import { RouterProvider } from 'react-router';
import { AppProvider } from './context/AppContext';
import { router } from './routes';
import { Toaster } from 'sonner';
import { AnimatedBackground } from './components/AnimatedBackground';

export default function App() {
  return (
    <AppProvider>
      <AnimatedBackground />
      <Toaster position="top-right" offset="80px" richColors theme="light" />
      <RouterProvider router={router} />
    </AppProvider>
  );
}
