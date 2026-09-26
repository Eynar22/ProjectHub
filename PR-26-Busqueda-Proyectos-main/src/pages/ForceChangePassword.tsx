import { useState } from 'react';
import { LIMITES, CAMPOS, validarCampos, validarConfirmacion, primerError } from '@/shared/validacion';
import { toast } from 'sonner';
import { useCambiarPassword } from '@/features/auth';
import { useApp } from '@/app/context/AppContext';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Navbar } from '@/shared/components/layout/Navbar';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function ForceChangePassword() {
  const { refreshCurrentUser, logout } = useApp();
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const cambiarPassword = useCambiarPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error =
      primerError(validarCampos({ passwordTemporal, nuevaPassword }, {
        passwordTemporal: { etiqueta: 'La contraseña temporal', requerido: true },
        nuevaPassword: { ...CAMPOS.password, etiqueta: 'La nueva contraseña' },
      })) ?? validarConfirmacion(nuevaPassword, confirmarPassword);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await cambiarPassword.mutateAsync({
        password_actual: passwordTemporal,
        password_nueva: nuevaPassword,
      });
      toast.success('Contraseña actualizada. ¡Bienvenido!');
      await refreshCurrentUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña');
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
              <div className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Cambia tu Contraseña</h1>
            <p className="text-center text-muted-foreground mb-8">
              Por seguridad, debes cambiar la contraseña temporal que recibiste por correo antes de continuar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Contraseña temporal (la que recibiste por correo)"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={passwordTemporal} maxLength={LIMITES.usuario.password_max}
                onChange={(e) => setPasswordTemporal(e.target.value)}
              />

              <Input
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={nuevaPassword} maxLength={LIMITES.usuario.password_max}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />

              <Input
                label="Confirmar nueva contraseña"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmarPassword} maxLength={LIMITES.usuario.password_max}
                onChange={(e) => setConfirmarPassword(e.target.value)}
              />

              <Button type="submit" variant="primary" className="w-full" disabled={cambiarPassword.isPending}>
                {cambiarPassword.isPending ? 'Actualizando...' : 'Cambiar Contraseña y Continuar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cerrar sesión
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
