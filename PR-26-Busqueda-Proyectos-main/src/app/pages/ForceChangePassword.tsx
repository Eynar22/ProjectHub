import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function ForceChangePassword() {
  const { refreshCurrentUser, logout } = useApp();
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordTemporal || !nuevaPassword) {
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

    setIsLoading(true);
    try {
      await api.post('/auth/change-password', {
        password_actual: passwordTemporal,
        password_nueva: nuevaPassword,
      });
      toast.success('Contraseña actualizada. ¡Bienvenido!');
      await refreshCurrentUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña');
    } finally {
      setIsLoading(false);
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
              <div className="w-16 h-16 bg-gradient-to-br from-warning to-orange-500 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-white" />
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
                placeholder="••••••••"
                value={passwordTemporal}
                onChange={(e) => setPasswordTemporal(e.target.value)}
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

              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Cambiar Contraseña y Continuar'}
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
