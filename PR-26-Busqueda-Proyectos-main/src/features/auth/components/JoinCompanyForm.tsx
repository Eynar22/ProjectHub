import { useState } from 'react';
import { toast } from 'sonner';
import { useRegistrarEmpleado } from '@/features/auth';
import type { Company } from '@/features/empresas';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { Building2 } from 'lucide-react';

// El backend acepta hasta 20MB por request en base64 (~20/1.37 ≈ 14.6MB en binario).
const MAX_DOCUMENT_MB = 6;

export function JoinCompanyForm({ company, onBack, onSuccess }: {
  company: Company | undefined;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [joinData, setJoinData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    jobTitle: '', memberDocument: null as File | null,
  });
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrarEmpleado = useRegistrarEmpleado();

  const handleJoinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setJoinErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateJoin = () => {
    const errs: Record<string, string> = {};
    if (!joinData.name) errs.name = 'El nombre es requerido';
    if (!joinData.jobTitle) errs.jobTitle = 'El cargo es requerido';
    if (!joinData.email) errs.email = 'El email es requerido';
    if (!joinData.password) errs.password = 'La contraseña es requerida';
    if (joinData.password !== joinData.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    if (!joinData.memberDocument) errs.memberDocument = 'Debe adjuntar un documento que acredite su pertenencia a la empresa';
    setJoinErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateJoin() || isSubmitting || !company) return;
    setIsSubmitting(true);
    try {
      await registrarEmpleado.mutateAsync({
        nombre_completo: joinData.name,
        correo: joinData.email,
        password: joinData.password,
        cargo: joinData.jobTitle,
        empresa_id: company.id,
        documento: joinData.memberDocument!,
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
        {company?.logo_url
          ? <img src={company.logo_url} alt={company.nombre} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0"><Building2 className="w-7 h-7 text-primary-foreground" /></div>
        }
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{company?.nombre}</h1>
          <p className="text-muted-foreground text-sm">Solicitar acceso a esta empresa</p>
          {company?.descripcion && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{company.descripcion}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleJoinSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Nombre completo *" type="text" name="name" autoComplete="name" placeholder="Juan Pérez" value={joinData.name} onChange={handleJoinChange} error={joinErrors.name} />
          <Input label="Cargo en la empresa *" type="text" name="jobTitle" autoComplete="organization-title" placeholder="Ej: Gerente de Proyectos" value={joinData.jobTitle} onChange={handleJoinChange} error={joinErrors.jobTitle} />
        </div>
        <Input label="Email *" type="email" name="email" autoComplete="email" placeholder="juan@empresa.com" value={joinData.email} onChange={handleJoinChange} error={joinErrors.email} />
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Contraseña *" type="password" name="password" autoComplete="new-password" placeholder="••••••••" value={joinData.password} onChange={handleJoinChange} error={joinErrors.password} />
          <Input label="Confirmar Contraseña *" type="password" name="confirmPassword" autoComplete="new-password" placeholder="••••••••" value={joinData.confirmPassword} onChange={handleJoinChange} error={joinErrors.confirmPassword} />
        </div>

        <DocumentUpload
          label="Documento de pertenencia a la empresa *"
          hint="Carta de la empresa, contrato laboral, carnet institucional u otro documento que confirme que usted pertenece a esta empresa."
          value={joinData.memberDocument}
          onChange={file => { setJoinData(prev => ({ ...prev, memberDocument: file })); setJoinErrors(prev => ({ ...prev, memberDocument: '' })); }}
          onRemove={() => setJoinData(prev => ({ ...prev, memberDocument: null }))}
          error={joinErrors.memberDocument}
          maxSizeMB={MAX_DOCUMENT_MB}
        />

        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          Tu solicitud será revisada por el administrador de <strong>{company?.nombre}</strong>. Te notificarán cuando sea aprobada.
        </p>
        <Button type="submit" variant="primary" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Mandando solicitud...' : 'Enviar Solicitud de Ingreso'}
        </Button>
      </form>
    </Card>
  );
}
