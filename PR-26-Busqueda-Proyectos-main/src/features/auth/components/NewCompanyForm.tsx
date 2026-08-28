import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRegistrarEmpresa } from '@/features/auth';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { Building2, User, Paperclip, Sparkles, ChevronDown, X } from 'lucide-react';

// El backend acepta hasta 20MB por request en base64 (~20/1.37 ≈ 14.6MB en binario).
// Este flujo sube documentos + logo + fotos en la misma petición: margen por archivo.
const MAX_DOCUMENT_MB = 6;

// Orden de los campos; para llevar el foco al primero con error al enviar.
const FIELD_ORDER = [
  'name', 'jobTitle', 'email', 'password', 'confirmPassword',
  'companyName', 'description', 'employees', 'portfolio',
  'companyDocument', 'personalDocument',
];

export function NewCompanyForm({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [data, setData] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', jobTitle: '',
    companyName: '', description: '', employees: '', portfolio: '',
    companyDocument: null as File | null,
    personalDocument: null as File | null,
    logo: null as File | null,
    fotos: [] as File[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fotosInputRef = useRef<HTMLInputElement>(null);

  const registrarEmpresa = useRegistrarEmpresa();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const setDoc = (key: 'companyDocument' | 'personalDocument', file: File | null) => {
    setData(prev => ({ ...prev, [key]: file }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleFotosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) setData(prev => ({ ...prev, fotos: [...prev.fotos, ...files] }));
    if (fotosInputRef.current) fotosInputRef.current.value = '';
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.name) errs.name = 'El nombre es requerido';
    if (!data.jobTitle) errs.jobTitle = 'El cargo en la empresa es requerido';
    if (!data.email) errs.email = 'Email es requerido';
    if (!data.password) errs.password = 'Contraseña es requerida';
    if (data.password !== data.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    if (!data.companyName) errs.companyName = 'Nombre de empresa es requerido';
    if (!data.description) errs.description = 'Descripción es requerida';
    if (!data.employees) errs.employees = 'Número de empleados es requerido';
    else if (parseInt(data.employees) < 1) errs.employees = 'El número de empleados debe ser al menos 1';
    if (!data.portfolio) errs.portfolio = 'Portafolio es requerido';
    if (!data.companyDocument) errs.companyDocument = 'Obligatorio: documento de acreditación de la empresa (NIT, Matrícula, etc.)';
    if (!data.personalDocument) errs.personalDocument = 'Obligatorio: documento que prueba su pertenencia a esta empresa';
    setErrors(errs);
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      const firstKey = FIELD_ORDER.find(k => newErrors[k]) ?? Object.keys(newErrors)[0];
      const el = document.querySelector<HTMLElement>(`[name="${firstKey}"], [data-field="${firstKey}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
      toast.error('Revisa los campos marcados en rojo');
      return;
    }

    setIsSubmitting(true);
    try {
      await registrarEmpresa.mutateAsync({
        correo: data.email,
        password: data.password,
        empresa: {
          nombre: data.companyName,
          descripcion: data.description,
          num_empleados: parseInt(data.employees),
          portafolio: data.portfolio,
          logo: data.logo,
          fotos: data.fotos,
        },
        responsable: {
          nombre_completo: data.name,
          cargo: data.jobTitle,
          documentoEmpresa: data.companyDocument!,
          documentoPersonal: data.personalDocument!,
        },
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error registrando empresa. Revisa todos los datos ingresados.');
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
      <h1 className="text-2xl font-black tracking-tight text-center mb-2">Registrar Empresa</h1>
      <p className="text-center text-muted-foreground mb-8 text-sm">El Super Admin revisará tu solicitud antes de aprobarla.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del responsable */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold mb-3 border-b border-border pb-2">
            <User className="w-4 h-4 text-muted-foreground" /> Datos del Responsable
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Nombre completo *" type="text" name="name" autoComplete="name" placeholder="Ana García" value={data.name} onChange={handleChange} error={errors.name} />
            <Input label="Cargo en la empresa *" type="text" name="jobTitle" autoComplete="organization-title" placeholder="Ej: CEO, Director Técnico" value={data.jobTitle} onChange={handleChange} error={errors.jobTitle} />
            <Input label="Email de contacto *" type="email" name="email" autoComplete="email" placeholder="ana@empresa.com" value={data.email} onChange={handleChange} error={errors.email} />
            <div className="hidden md:block" />
            <Input label="Contraseña *" type="password" name="password" autoComplete="new-password" placeholder="••••••••" value={data.password} onChange={handleChange} error={errors.password} />
            <Input label="Confirmar Contraseña *" type="password" name="confirmPassword" autoComplete="new-password" placeholder="••••••••" value={data.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
          </div>
        </section>

        {/* Datos de la empresa */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold mb-3 border-b border-border pb-2">
            <Building2 className="w-4 h-4 text-muted-foreground" /> Datos de la Empresa
          </h2>
          <div className="space-y-4">
            <Input label="Nombre de la empresa *" type="text" name="companyName" autoComplete="organization" placeholder="Mi Empresa S.A." value={data.companyName} onChange={handleChange} error={errors.companyName} />
            <TextArea label="Descripción *" name="description" placeholder="Describe tu empresa, industria y servicios..." rows={3} value={data.description} onChange={handleChange} error={errors.description} />
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Número de Empleados *" type="number" name="employees" min="1" placeholder="50" value={data.employees} onChange={handleChange} error={errors.employees} />
              <div className="hidden md:block" />
            </div>
            <TextArea label="Portafolio / Experiencia *" name="portfolio" placeholder="Proyectos anteriores, clientes principales, tecnologías..." rows={3} value={data.portfolio} onChange={handleChange} error={errors.portfolio} />
          </div>
        </section>

        {/* Identidad visual — opcional, colapsada */}
        <details className="group bg-card border border-border rounded-xl overflow-hidden">
          <summary className="flex items-center gap-3 px-4 py-3 bg-muted/40 cursor-pointer list-none [&::-webkit-details-marker]:hidden border-b border-transparent group-open:border-border">
            <Sparkles className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-sm">Identidad visual</span>
              <span className="ml-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">opcional</span>
              <p className="text-xs text-muted-foreground">Logo y fotos de la empresa</p>
            </div>
            <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
              {(data.logo ? 1 : 0) + data.fotos.length > 0 && <span>{(data.logo ? 1 : 0) + data.fotos.length} archivo(s)</span>}
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </span>
          </summary>

          <div className="p-4 space-y-5">
            <DocumentUpload
              label="Logo de la empresa"
              hint="Imagen cuadrada (PNG o JPG). Se muestra en tu perfil y en tus proyectos."
              value={data.logo}
              onChange={file => setData(prev => ({ ...prev, logo: file }))}
              onRemove={() => setData(prev => ({ ...prev, logo: null }))}
              maxSizeMB={MAX_DOCUMENT_MB}
              accept="image/png,image/jpeg,image/webp"
            />

            <div>
              <p className="text-sm font-medium mb-2">Fotos de la empresa</p>
              {data.fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {data.fotos.map((file, i) => (
                    <div key={i} className="relative group/foto aspect-video rounded-lg overflow-hidden bg-muted">
                      <img src={URL.createObjectURL(file)} alt={`foto-${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, fotos: prev.fotos.filter((_, j) => j !== i) }))}
                        aria-label="Quitar foto"
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-foreground/60 text-background flex items-center justify-center opacity-0 group-hover/foto:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fotosInputRef} type="file" multiple accept="image/*" onChange={handleFotosSelect} className="hidden" />
              <button
                type="button"
                onClick={() => fotosInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl py-5 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="text-sm font-medium">Añadir fotos</span>
                <span className="text-xs">PNG, JPG, WEBP</span>
              </button>
            </div>
          </div>
        </details>

        {/* Documentos de acreditación — obligatorios */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold mb-3 border-b border-border pb-2">
            <Paperclip className="w-4 h-4 text-muted-foreground" /> Documentos de Acreditación
          </h2>
          <div className="space-y-4">
            <div data-field="companyDocument">
              <DocumentUpload
                label="Documento 1 — Acreditación de la empresa *"
                hint="NIT, Matrícula de Comercio u otro documento legal que certifique la existencia de la empresa."
                value={data.companyDocument}
                onChange={file => setDoc('companyDocument', file)}
                onRemove={() => setDoc('companyDocument', null)}
                error={errors.companyDocument}
                maxSizeMB={MAX_DOCUMENT_MB}
              />
            </div>
            <div data-field="personalDocument">
              <DocumentUpload
                label="Documento 2 — Prueba de pertenencia personal *"
                hint="Documento que pruebe que usted pertenece a esta empresa (contrato, nombramiento, carnet, etc.)."
                value={data.personalDocument}
                onChange={file => setDoc('personalDocument', file)}
                onRemove={() => setDoc('personalDocument', null)}
                error={errors.personalDocument}
                maxSizeMB={MAX_DOCUMENT_MB}
              />
            </div>
          </div>
        </section>

        {/* Barra de acción fija */}
        <div className="sticky bottom-0 -mx-8 mt-2 border-t border-border bg-card/95 backdrop-blur-sm px-8 py-4">
          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando Empresa…' : 'Enviar Solicitud de Registro'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
