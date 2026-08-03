import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Input, TextArea } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { Building2, CheckCircle2, FileText, X, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type RegisterMode = 'choose' | 'join_company' | 'new_company' | 'success';

// ── Helper: Document upload field ──────────────────────────────────────────────────
function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  onRemove,
  error,
}: {
  label: string;
  hint: string;
  value: File | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {value ? (
        <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate max-w-[220px]">{value.name}</span>
          </div>
          <button type="button" onClick={onRemove} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${error ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
          <div className="flex flex-col items-center">
            <FileText className={`w-7 h-7 mb-1 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-xs text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> • PDF, JPG, PNG</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
            }}
          />
        </label>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

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

  const { companies, register, registerToCompany } = useApp();
  const navigate = useNavigate();

  const approvedCompanies = companies.filter(c => c.estado === 'aprobado');
  const filteredCompanies = approvedCompanies.filter(c =>
    c.nombre.toLowerCase().includes(companySearch.toLowerCase())
  );

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
      await registerToCompany({
        name: joinData.name,
        email: joinData.email,
        password: joinData.password,
        jobTitle: joinData.jobTitle,
        memberDocument: joinData.memberDocument!,
      }, Number(selectedCompanyId));
      setMode('success');
    } catch (err) {
      console.error(err);
      toast.error('Error en el registro');
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
      await register(
        newCompanyData.email,
        newCompanyData.password,
        {
          nombre: newCompanyData.companyName,
          descripcion: newCompanyData.description,
          num_empleados: parseInt(newCompanyData.employees),
          portafolio: newCompanyData.portfolio,
        },
        {
          name: newCompanyData.name,
          jobTitle: newCompanyData.jobTitle,
          companyDocument: newCompanyData.companyDocument!,
          personalDocument: newCompanyData.personalDocument!,
        }
      );
      setMode('success');
    } catch (err) {
      console.error(err);
      toast.error('Error registrando empresa: Por favor, revisa todos los datos ingresados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success ──
  if (mode === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <Navbar />
        <div className="flex items-center justify-center py-16 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-success to-accent rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      <div className="py-16 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

          {/* ── CHOOSE MODE ── */}
          {mode === 'choose' && (
            <Card className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
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
                    placeholder="Nombre de la empresa..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <AnimatePresence>
                {companySearch.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 border border-border rounded-xl overflow-hidden">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map(company => (
                        <button key={company.id} onClick={() => { setSelectedCompanyId(company.id.toString()); setMode('join_company'); }} className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left border-b border-border last:border-0">
                          {company.logo
                            ? <img src={company.logo} alt={company.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-white" /></div>
                          }
                          <div>
                            <p className="font-semibold text-sm">{company.nombre}</p>
                            <p className="text-xs text-muted-foreground">{company.num_empleados} empleados</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center">
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
                <button onClick={() => setMode('choose')} className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">← Volver</button>
                <div className="flex items-center gap-4 mb-6">
                  {company?.logo
                    ? <img src={company.logo} alt={company.nombre} className="w-14 h-14 rounded-xl object-cover" />
                    : <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center"><Building2 className="w-7 h-7 text-white" /></div>
                  }
                  <div>
                    <h1 className="text-2xl font-bold">{company?.nombre}</h1>
                    <p className="text-muted-foreground text-sm">Solicitar acceso a esta empresa</p>
                  </div>
                </div>

                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Nombre completo *" type="text" name="name" placeholder="Juan Pérez" value={joinData.name} onChange={handleJoinChange} error={joinErrors.name} />
                    <Input label="Cargo en la empresa *" type="text" name="jobTitle" placeholder="Ej: Gerente de Proyectos" value={joinData.jobTitle} onChange={handleJoinChange} error={joinErrors.jobTitle} />
                  </div>
                  <Input label="Email *" type="email" name="email" placeholder="juan@empresa.com" value={joinData.email} onChange={handleJoinChange} error={joinErrors.email} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Contraseña *" type="password" name="password" placeholder="••••••••" value={joinData.password} onChange={handleJoinChange} error={joinErrors.password} />
                    <Input label="Confirmar Contraseña *" type="password" name="confirmPassword" placeholder="••••••••" value={joinData.confirmPassword} onChange={handleJoinChange} error={joinErrors.confirmPassword} />
                  </div>

                  <DocumentUpload
                    label="Documento de pertenencia a la empresa *"
                    hint="Carta de la empresa, contrato laboral, carnet institucional u otro documento que confirme que usted pertenece a esta empresa."
                    value={joinData.memberDocument}
                    onChange={file => { setJoinData(prev => ({ ...prev, memberDocument: file })); setJoinErrors(prev => ({ ...prev, memberDocument: '' })); }}
                    onRemove={() => setJoinData(prev => ({ ...prev, memberDocument: null }))}
                    error={joinErrors.memberDocument}
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
              <button onClick={() => setMode('choose')} className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">← Volver</button>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Registrar Empresa</h1>
              <p className="text-center text-muted-foreground mb-8">El Super Admin revisará tu solicitud antes de aprobarla.</p>

              <form onSubmit={handleNewSubmit} className="space-y-5">
                {/* Datos del responsable */}
                <div>
                  <h2 className="text-base font-semibold mb-3 text-primary border-b border-border pb-2">📋 Datos del Responsable</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Nombre completo *" type="text" name="name" placeholder="Ana García" value={newCompanyData.name} onChange={handleNewChange} error={newCompanyErrors.name} />
                    <Input label="Cargo en la empresa *" type="text" name="jobTitle" placeholder="Ej: CEO, Director Técnico" value={newCompanyData.jobTitle} onChange={handleNewChange} error={newCompanyErrors.jobTitle} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <Input label="Email de contacto *" type="email" name="email" placeholder="ana@empresa.com" value={newCompanyData.email} onChange={handleNewChange} error={newCompanyErrors.email} />
                    <div />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <Input label="Contraseña *" type="password" name="password" placeholder="••••••••" value={newCompanyData.password} onChange={handleNewChange} error={newCompanyErrors.password} />
                    <Input label="Confirmar Contraseña *" type="password" name="confirmPassword" placeholder="••••••••" value={newCompanyData.confirmPassword} onChange={handleNewChange} error={newCompanyErrors.confirmPassword} />
                  </div>
                </div>

                {/* Datos de la empresa */}
                <div>
                  <h2 className="text-base font-semibold mb-3 text-primary border-b border-border pb-2">🏢 Datos de la Empresa</h2>
                  <Input label="Nombre de la empresa *" type="text" name="companyName" placeholder="Mi Empresa S.A." value={newCompanyData.companyName} onChange={handleNewChange} error={newCompanyErrors.companyName} />
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
                    />
                    <DocumentUpload
                      label="Documento 2 — Prueba de pertenencia personal *"
                      hint="Documento que pruebe que usted pertenece a esta empresa (contrato, nombramiento, carnet, etc.)."
                      value={newCompanyData.personalDocument}
                      onChange={file => { setNewCompanyData(prev => ({ ...prev, personalDocument: file })); setNewCompanyErrors(prev => ({ ...prev, personalDocument: '' })); }}
                      onRemove={() => setNewCompanyData(prev => ({ ...prev, personalDocument: null }))}
                      error={newCompanyErrors.personalDocument}
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
