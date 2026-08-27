import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { useSolicitarCodigoRecuperacion } from '@/features/auth';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Navbar } from '@/shared/components/layout/Navbar';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const [correo, setCorreo] = useState('');
  const navigate = useNavigate();
  const solicitarCodigo = useSolicitarCodigoRecuperacion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim()) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }

    try {
      await solicitarCodigo.mutateAsync(correo.trim());
      toast.success('Si el correo está registrado, recibirás un código de verificación.');
      navigate(`/reset-password?correo=${encodeURIComponent(correo.trim())}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el código');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="flex items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Recuperar Contraseña</h1>
            <p className="text-center text-muted-foreground mb-8">
              Ingresa tu correo y te enviaremos un código de verificación
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />

              <Button type="submit" variant="primary" className="w-full" disabled={solicitarCodigo.isPending}>
                {solicitarCodigo.isPending ? 'Enviando...' : 'Enviar Código'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a iniciar sesión
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
