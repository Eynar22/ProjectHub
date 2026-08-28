import { useState } from 'react';
import { toast } from 'sonner';

import { useRegistrarIndependiente } from '@/features/auth';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { UserRound } from 'lucide-react';

// El backend acepta hasta 20MB por request en base64; el CV se limita a 6MB.
const MAX_CV_MB = 6;

export function IndependentRegisterForm({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [datos, setDatos] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    jobTitle: '', cv: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrarIndependiente = useRegistrarIndependiente();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatos(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!datos.name) errs.name = 'El nombre es requerido';
    if (!datos.email) errs.email = 'El email es requerido';
    if (!datos.password) errs.password = 'La contraseña es requerida';
    if (datos.password !== datos.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await registrarIndependiente.mutateAsync({
        nombre_completo: datos.name,
        correo: datos.email,
        password: datos.password,
        cargo: datos.jobTitle || undefined,
        cv: datos.cv,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 -ml-2 px-2 min-h-11 inline-flex items-center gap-1">← Volver</button>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <UserRound className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Cuenta independiente</h1>
          <p className="text-muted-foreground text-sm">
            Sin empresa. Podrás explorar proyectos y postular a los que te interesen.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Nombre completo *" type="text" name="name" autoComplete="name" placeholder="Juan Pérez" value={datos.name} onChange={handleChange} error={errors.name} />
          <Input label="Rol o profesión" type="text" name="jobTitle" autoComplete="organization-title" placeholder="Ej: Desarrollador Frontend" value={datos.jobTitle} onChange={handleChange} error={errors.jobTitle} />
        </div>
        <Input label="Email *" type="email" name="email" autoComplete="email" placeholder="juan@correo.com" value={datos.email} onChange={handleChange} error={errors.email} />
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Contraseña *" type="password" name="password" autoComplete="new-password" placeholder="••••••••" value={datos.password} onChange={handleChange} error={errors.password} />
          <Input label="Confirmar Contraseña *" type="password" name="confirmPassword" autoComplete="new-password" placeholder="••••••••" value={datos.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
        </div>

        <DocumentUpload
          label="CV (opcional)"
          hint="Tu currículum en PDF. También podrás adjuntarlo al postular a cada proyecto."
          value={datos.cv}
          onChange={file => { setDatos(prev => ({ ...prev, cv: file })); }}
          onRemove={() => setDatos(prev => ({ ...prev, cv: null }))}
          maxSizeMB={MAX_CV_MB}
        />

        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          Tu cuenta queda activa de inmediato: no necesitas aprobación de nadie.
        </p>
        <Button type="submit" variant="primary" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
    </Card>
  );
}
