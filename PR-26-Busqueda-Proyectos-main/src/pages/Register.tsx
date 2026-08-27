import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useRegistrarEmpresa, useRegistrarEmpleado } from '@/features/auth';
import { useEmpresas, empresasService } from '@/features/empresas';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Navbar } from '@/shared/components/layout/Navbar';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { Building2, CheckCircle2, Search, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type RegisterMode = 'choose' | 'join_company' | 'new_company' | 'success';

// El backend acepta hasta 20MB por request en base64 (~20/1.37 ≈ 14.6MB en binario).
// Flujo B sube 2 documentos en la misma petición, así que se deja margen por archivo.
const MAX_DOCUMENT_MB = 6;

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Register() {
  const [mode, setMode] = useState<RegisterMode>('choose');
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Flujo A state
  const [joinData, setJoinData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    jobTitle: '', memberDocument: null as File | null,
  });
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});

  // Flujo B state
  const [newCompanyData, setNewCompanyData] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', jobTitle: '',
    companyName: '', description: '', employees: '', portfolio: '',
    companyDocument: null as File | null,   // NIT / Matrícula
    personalDocument: null as File | null,  // Prueba de pertenencia personal
  });
  const [newCompanyErrors, setNewCompanyErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: companies = [] } = useEmpresas();
  const registrarEmpresa = useRegistrarEmpresa();
  const registrarEmpleado = useRegistrarEmpleado();
  const navigate = useNavigate();

  const approvedCompanies = companies.filter(c => c.estado === 'aprobado');
  const filteredCompanies = approvedCompanies.filter(c =>
    c.nombre.toLowerCase().includes(companySearch.toLowerCase())
  );

  // El listado general de empresas no trae la galería de fotos (para no cargar
  // eso en cada arranque de la app); se pide puntual acá, solo para las
  // empresas que aparecen en los resultados de búsqueda. `null` = ya se
  // consultó y no tiene fotos; `undefined` = todavía no se consultó.
  const [companyPhotos, setCompanyPhotos] = useState<Record<number, string | null>>({});

  useEffect(() => {
    filteredCompanies.slice(0, 12).forEach(company => {
      if (companyPhotos[company.id] !== undefined) return;
      empresasService.obtenerPorId(company.id)
        .then(data => setCompanyPhotos(prev => ({ ...prev, [company.id]: data.imagenes?.[0]?.url || null })))
        .catch(() => setCompanyPhotos(prev => ({ ...prev, [company.id]: null })));
    });
  }, [companySearch, companies]);

  // ── Flujo A handlers ──
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
    if (!validateJoin() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await registrarEmpleado.mutateAsync({
        nombre_completo: joinData.name,
        correo: joinData.email,
        password: joinData.password,
        cargo: joinData.jobTitle,
        empresa_id: Number(selectedCompanyId),
        documento: joinData.memberDocument!,
      });
      setMode('success');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Flujo B handlers ──
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
      setMode('success');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error registrando empresa: Por favor, revisa todos los datos ingresados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success ──
  if (mode === 'success') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-16 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">¡Solicitud Enviada!</h1>
              <p className="text-muted-foreground mb-8">
                {selectedCompanyId
                  ? 'Tu solicitud fue enviada al administrador de la empresa. Te notificarán cuando sea aprobada.'
                  : 'Tu solicitud de empresa fue enviada al Super Admin para revisión. Una vez aprobada podrás iniciar sesión.'}
              </p>
              <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
                Ir a Iniciar Sesión
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="py-16 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

          {/* ── CHOOSE MODE ── */}
          {mode === 'choose' && (
            <Card className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Crear Cuenta</h1>
              <p className="text-center text-muted-foreground mb-8">¿Tu empresa ya está registrada en la plataforma?</p>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Busca tu empresa</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    aria-label="Buscar tu empresa" placeholder="Nombre de la empresa..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <AnimatePresence>
                {companySearch.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                    {filteredCompanies.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {filteredCompanies.map(company => {
                          const photo = companyPhotos[company.id];
                          return (
                            <button
                              key={company.id}
                              onClick={() => { setSelectedCompanyId(company.id.toString()); setMode('join_company'); }}
                              className="w-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all text-left"
                            >
                              {/* Foto de portada de la empresa */}
                              <div className="h-20 w-full bg-primary/10">
                                {photo ? (
                                  <img src={photo} alt={company.nombre} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="w-7 h-7 text-primary/25" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-start gap-3 p-4 pt-0">
                                {company.logo_url
                                  ? <img src={company.logo_url} alt={company.nombre} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-card shadow-md -mt-6 bg-card" />
                                  : <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-card shadow-md -mt-6"><Building2 className="w-5 h-5 text-primary-foreground" /></div>
                                }
                                <div className="min-w-0 flex-1 pt-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-sm">{company.nombre}</p>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                                      <Users className="w-3 h-3" /> {company.num_empleados ?? '—'} empleados
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {company.descripcion || 'Sin descripción disponible.'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-border rounded-xl">
                        <p className="text-sm text-muted-foreground mb-3">No encontramos tu empresa</p>
                        <Button variant="primary" size="sm" onClick={() => setMode('new_company')}>Registrar nueva empresa</Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-card px-2">o</span></div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setMode('new_company')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Mi empresa no está — Quiero registrarla
              </Button>
              <p className="text-center text-muted-foreground mt-6 text-sm">
                ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
              </p>
            </Card>
          )}

          {/* ── FLUJO A: JOIN COMPANY ── */}
          {mode === 'join_company' && (() => {
            const company = companies.find(c => c.id === Number(selectedCompanyId));
            return (
              <Card className="p-8">
                <button onClick={() => setMode('choose')} className="text-sm text-muted-foreground hover:text-foreground mb-4 -ml-2 px-2 min-h-11 inline-flex items-center gap-1">← Volver</button>
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
          })()}

          {/* ── FLUJO B: NEW COMPANY ── */}
          {mode === 'new_company' && (
            <Card className="p-8">
              <button onClick={() => setMode('choose')} className="text-sm text-muted-foreground hover:text-foreground mb-4 -ml-2 px-2 min-h-11 inline-flex items-center gap-1">← Volver</button>
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
          )}
        </motion.div>
      </div>
    </div>
  );
}
