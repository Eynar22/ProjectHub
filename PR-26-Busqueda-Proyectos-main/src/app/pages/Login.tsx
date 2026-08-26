import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { Building2, AlertCircle, Clock, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ title: string; message: string; type: 'pending' | 'rejected' | 'suspended' } | null>(null);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    
    if (res.success) {
      toast.success('¡Bienvenido de nuevo!');
      if (email === 'admin@platform.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      const msg = res.message?.toLowerCase() || '';
      
      if (msg.includes('denegada') || msg.includes('rechazado')) {
        setStatusMessage({ title: 'Solicitud Rechazada', message: res.message!, type: 'rejected' });
      } else if (msg.includes('aún no ha sido aprobada') || msg.includes('pendiente')) {
        setStatusMessage({ title: 'Solicitud en Revisión', message: res.message!, type: 'pending' });
      } else if (msg.includes('suspendido') || msg.includes('bloqueado')) {
        setStatusMessage({ title: 'Cuenta Suspendida', message: res.message!, type: 'suspended' });
      } else {
        setError(res.message || 'Credenciales inválidas o empresa no aprobada');
      }
    }
  };

  if (statusMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <Navbar />
        <div className="flex items-center justify-center py-16 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
            <Card className="p-8 text-center border-t-4 border-t-primary shadow-xl">
               <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-muted">
                 {statusMessage.type === 'rejected' && <AlertCircle className="w-10 h-10 text-destructive" />}
                 {statusMessage.type === 'pending' && <Clock className="w-10 h-10 text-warning" />}
                 {statusMessage.type === 'suspended' && <Info className="w-10 h-10 text-orange-500" />}
               </div>
               <h2 className="text-3xl font-bold mb-4">{statusMessage.title}</h2>
               <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                 {statusMessage.message}
               </p>
               <Button onClick={() => setStatusMessage(null)} variant="outline" className="w-full">
                 Volver al inicio de sesión
               </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />

      <div className="flex items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
            <p className="text-center text-muted-foreground mb-8">
              Accede a tu cuenta para gestionar proyectos
            </p>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="text-right -mt-2">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
