import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { toast } from 'sonner';
import { useRestablecerPassword } from '@/features/auth';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Navbar } from '@/shared/components/layout/Navbar';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [correo, setCorreo] = useState(searchParams.get('correo') || '');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const navigate = useNavigate();
  const restablecer = useRestablecerPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!correo.trim() || !codigo.trim() || !nuevaPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (nuevaPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      await restablecer.mutateAsync({
        correo: correo.trim(),
        codigo: codigo.trim(),
        nueva_password: nuevaPassword,
      });
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña');
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
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Restablecer Contraseña</h1>
            <p className="text-center text-muted-foreground mb-8">
              Ingresa el código de 6 dígitos que enviamos a tu correo y tu nueva contraseña
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="tu@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />

              <Input
                label="Código de verificación"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-[0.5em] font-semibold"
              />

              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="••••••••"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />

              <Input
                label="Confirmar nueva contraseña"
                type="password"
                placeholder="••••••••"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
              />

              <Button type="submit" variant="primary" className="w-full" disabled={restablecer.isPending}>
                {restablecer.isPending ? 'Actualizando...' : 'Restablecer Contraseña'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> ¿No recibiste el código? Solicitar de nuevo
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
