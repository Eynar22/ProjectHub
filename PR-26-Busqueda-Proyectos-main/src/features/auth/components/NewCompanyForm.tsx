import { useState } from 'react';
import { toast } from 'sonner';
import { useRegistrarEmpresa } from '@/features/auth';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { Building2 } from 'lucide-react';

// El backend acepta hasta 20MB por request en base64 (~20/1.37 ≈ 14.6MB en binario).
// Este flujo sube 2 documentos en la misma petición, así que se deja margen por archivo.
const MAX_DOCUMENT_MB = 6;

export function NewCompanyForm({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [newCompanyData, setNewCompanyData] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', jobTitle: '',
    companyName: '', description: '', employees: '', portfolio: '',
    companyDocument: null as File | null,   // NIT / Matrícula
    personalDocument: null as File | null,  // Prueba de pertenencia personal
  });
  const [newCompanyErrors, setNewCompanyErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrarEmpresa = useRegistrarEmpresa();

  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewCompanyData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setNewCompanyErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateNew = () => {
    const errs: Record<string, string> = {};
    if (!newCompanyData.name) errs.name = 'El nombre es requerido';
    if (!newCompanyData.jobTitle) errs.jobTitle = 'El cargo en la empresa es requerido';
    if (!newCompanyData.email) errs.email = 'Email es requerido';
    if (!newCompanyData.password) errs.password = 'Contraseña es requerida';
    if (newCompanyData.password !== newCompanyData.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    if (!newCompanyData.companyName) errs.companyName = 'Nombre de empresa es requerido';
    if (!newCompanyData.description) errs.description = 'Descripción es requerida';
    if (!newCompanyData.employees) {
      errs.employees = 'Número de empleados es requerido';
    } else if (parseInt(newCompanyData.employees) < 1) {
      errs.employees = 'El número de empleados debe ser al menos 1';
    }
    if (!newCompanyData.portfolio) errs.portfolio = 'Portafolio es requerido';
    if (!newCompanyData.companyDocument) errs.companyDocument = 'Obligatorio: documento de acreditación de la empresa (NIT, Matrícula, etc.)';
    if (!newCompanyData.personalDocument) errs.personalDocument = 'Obligatorio: documento que prueba su pertenencia a esta empresa';
    setNewCompanyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNew() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await registrarEmpresa.mutateAsync({
        correo: newCompanyData.email,
        password: newCompanyData.password,
        empresa: {
          nombre: newCompanyData.companyName,
          descripcion: newCompanyData.description,
          num_empleados: parseInt(newCompanyData.employees),
          portafolio: newCompanyData.portfolio,
        },
        responsable: {
          nombre_completo: newCompanyData.name,
          cargo: newCompanyData.jobTitle,
          documentoEmpresa: newCompanyData.companyDocument!,
          documentoPersonal: newCompanyData.personalDocument!,
        },
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error registrando empresa: Por favor, revisa todos los datos ingresados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 -ml-2 px-2 min-h-11 inline-flex items-center gap-1">← Volver</button>
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-center mb-2">Registrar Empresa</h1>
      <p className="text-center text-muted-foreground mb-8">El Super Admin revisará tu solicitud antes de aprobarla.</p>

      <form onSubmit={handleNewSubmit} className="space-y-5">
        {/* Datos del responsable */}
        <div>
          <h2 className="text-base font-semibold mb-3 text-primary border-b border-border pb-2">📋 Datos del Responsable</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Nombre completo *" type="text" name="name" autoComplete="name" placeholder="Ana García" value={newCompanyData.name} onChange={handleNewChange} error={newCompanyErrors.name} />
            <Input label="Cargo en la empresa *" type="text" name="jobTitle" autoComplete="organization-title" placeholder="Ej: CEO, Director Técnico" value={newCompanyData.jobTitle} onChange={handleNewChange} error={newCompanyErrors.jobTitle} />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input label="Email de contacto *" type="email" name="email" autoComplete="email" placeholder="ana@empresa.com" value={newCompanyData.email} onChange={handleNewChange} error={newCompanyErrors.email} />
            <div />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input label="Contraseña *" type="password" name="password" autoComplete="new-password" placeholder="••••••••" value={newCompanyData.password} onChange={handleNewChange} error={newCompanyErrors.password} />
            <Input label="Confirmar Contraseña *" type="password" name="confirmPassword" autoComplete="new-password" placeholder="••••••••" value={newCompanyData.confirmPassword} onChange={handleNewChange} error={newCompanyErrors.confirmPassword} />
          </div>
        </div>

        {/* Datos de la empresa */}
        <div>
          <h2 className="text-base font-semibold mb-3 text-primary border-b border-border pb-2">🏢 Datos de la Empresa</h2>
          <Input label="Nombre de la empresa *" type="text" name="companyName" autoComplete="organization" placeholder="Mi Empresa S.A." value={newCompanyData.companyName} onChange={handleNewChange} error={newCompanyErrors.companyName} />
          <div className="mt-4">
            <TextArea label="Descripción *" name="description" placeholder="Describe tu empresa, industria y servicios..." rows={3} value={newCompanyData.description} onChange={handleNewChange} error={newCompanyErrors.description} />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input label="Número de Empleados *" type="number" name="employees" min="1" placeholder="50" value={newCompanyData.employees} onChange={handleNewChange} error={newCompanyErrors.employees} />
            <div />
          </div>
          <div className="mt-4">
            <TextArea label="Portafolio / Experiencia *" name="portfolio" placeholder="Proyectos anteriores, clientes principales, tecnologías..." rows={3} value={newCompanyData.portfolio} onChange={handleNewChange} error={newCompanyErrors.portfolio} />
          </div>
        </div>

        {/* Documentos */}
        <div>
          <h2 className="text-base font-semibold mb-3 text-primary border-b border-border pb-2">📎 Documentos de Acreditación</h2>
          <div className="space-y-4">
            <DocumentUpload
              label="Documento 1 — Acreditación de la empresa *"
              hint="NIT, Matrícula de Comercio u otro documento legal que certifique la existencia de la empresa."
              value={newCompanyData.companyDocument}
              onChange={file => { setNewCompanyData(prev => ({ ...prev, companyDocument: file })); setNewCompanyErrors(prev => ({ ...prev, companyDocument: '' })); }}
              onRemove={() => setNewCompanyData(prev => ({ ...prev, companyDocument: null }))}
              error={newCompanyErrors.companyDocument}
              maxSizeMB={MAX_DOCUMENT_MB}
            />
            <DocumentUpload
              label="Documento 2 — Prueba de pertenencia personal *"
              hint="Documento que pruebe que usted pertenece a esta empresa (contrato, nombramiento, carnet, etc.)."
              value={newCompanyData.personalDocument}
              onChange={file => { setNewCompanyData(prev => ({ ...prev, personalDocument: file })); setNewCompanyErrors(prev => ({ ...prev, personalDocument: '' })); }}
              onRemove={() => setNewCompanyData(prev => ({ ...prev, personalDocument: null }))}
              error={newCompanyErrors.personalDocument}
              maxSizeMB={MAX_DOCUMENT_MB}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando Empresa...' : 'Enviar Solicitud de Registro'}
        </Button>
      </form>
    </Card>
  );
}
