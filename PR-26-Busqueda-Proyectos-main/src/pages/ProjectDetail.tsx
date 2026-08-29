import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import {
  useProyectos,
  useProyectosArchivados,
  useProyecto,
  useSolicitudesEnviadas,
  useCrearSolicitud,
  useTransferirProyecto,
  type Resource,
} from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { TextArea } from '@/shared/components/ui/Input';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { useDocumentTitle } from '@/shared/utils/useDocumentTitle';
import { esIndependiente } from '@/shared/utils/roles';
import { Avatar } from '@/shared/components/ui/Avatar';
import { ODS_POR_ID } from '@/shared/constants/ods';
import {
  Building2,
  FileText,
  ArrowLeft,
  Send,
  Download,
  AlertOctagon,
  RefreshCcw,
  ArrowRight,
  FolderOpen,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const parseDate = (dateString) => {
  if (!dateString) return { day: '--', month: '---', year: '----' };
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return { day: parts[2], month: months[parseInt(parts[1]) - 1].toUpperCase(), year: parts[0] };
  }
  return { day: '--', month: '---', year: '----' };
};

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

// El backend acepta hasta 20MB por request en base64; el CV se limita a 6MB.
const MAX_CV_MB = 6;

export default function ProjectDetail() {
  const { id } = useParams();
  const { currentUser, openBase64 } = useApp();
  const { data: projects = [] } = useProyectos();
  const { data: archivedProjects = [] } = useProyectosArchivados(!!currentUser);
  const { data: companies = [] } = useEmpresas();
  const { data: users = [] } = useUsuarios(!!currentUser);
  const { data: requests = [] } = useSolicitudesEnviadas(!!currentUser);
  const crearSolicitud = useCrearSolicitud();
  const transferir = useTransferirProyecto();
  const location = useLocation();

  const fromPage = location.state?.from;
  const backUrl = fromPage === 'my-projects' ? '/dashboard/projects' : '/explore';
  const backLabel = fromPage === 'my-projects' ? 'Volver a Mis Proyectos' : 'Volver a Explorar';
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [propuesta, setPropuesta] = useState('');
  const [propuestaFile, setPropuestaFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const projectLigero = projects.find(p => p.id === Number(id)) || archivedProjects.find(p => p.id === Number(id));
  const { data: projectCompleto } = useProyecto(id);

  const project = projectCompleto ?? projectLigero;
  useDocumentTitle(project?.nombre);
  const creator = project ? users.find(u => u.id === project.creador_id) : null;
  const ownerCompany = creator ? companies.find(c => c.id === creator.empresa_id) : null;
  const participatingUsers = project?.participantes?.map(p => p.usuario) || [];

  const recursosFolder = project?.recursos?.find(r => r.nombre === 'Recursos' && r.tipo === 'carpeta' && !r.padre_id);

  const getAllFilesInFolder = (folderId: number | undefined): Resource[] => {
    if (!folderId || !project?.recursos) return [];
    const result: Resource[] = [];
    const children = project.recursos.filter(r => r.padre_id === folderId);
    children.forEach(child => {
      if (child.tipo === 'archivo') {
        result.push(child);
      } else if (child.tipo === 'carpeta') {
        result.push(...getAllFilesInFolder(child.id));
      }
    });
    return result;
  };

  const archivos = getAllFilesInFolder(recursosFolder?.id);

  const isParticipant = project?.participantes?.some(p => p.usuario_id === currentUser?.id);
  const isOwner = currentUser?.id === project?.creador_id;
  // Usuario independiente: sin empresa. Al postular debe enviar propuesta + CV.
  const usuarioIndependiente = esIndependiente(currentUser);
  const hasPendingRequest = requests?.some(r => r.proyecto_id === project?.id && r.usuario_id === currentUser?.id && r.estado === 'pendiente');

  const canRequestParticipation =
    !project?.suspendido &&
    (currentUser?.rol === 'admin' || currentUser?.rol === 'empleado' || currentUser?.rol === 'colaborador') &&
    project &&
    !isOwner &&
    !isParticipant &&
    !hasPendingRequest;

  const canTransfer = currentUser?.rol === 'superadmin';
  const companyUsers = users.filter(u => u.empresa_id === ownerCompany?.id && u.estado === 'activo' && u.id !== creator?.id);

  if (!project) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
          <Link to="/explore"><Button variant="primary">Volver a Explorar</Button></Link>
        </div>
      </div>
    );
  }

  const handleRequestParticipation = async () => {
    if (crearSolicitud.isPending || !project) return;

    // Los postulantes independientes deben adjuntar propuesta de solución y CV.
    if (usuarioIndependiente) {
      if (!propuesta.trim()) { toast.error('Escribe tu propuesta de solución'); return; }
      if (!cvFile) { toast.error('Adjunta tu CV en PDF'); return; }
    }

    try {
      await crearSolicitud.mutateAsync({
        proyectoId: project.id,
        mensaje: message,
        propuesta: usuarioIndependiente ? propuesta.trim() : undefined,
        propuestaArchivo: usuarioIndependiente ? propuestaFile : undefined,
        cv: usuarioIndependiente ? cvFile : undefined,
      });
      setShowRequestModal(false);
      setMessage('');
      setPropuesta('');
      setPropuestaFile(null);
      setCvFile(null);
    } catch {
      /* el toast lo muestra el hook */
    }
  };

  const handleTransfer = async () => {
    if (!selectedNewOwner || !project) return;
    try {
      await transferir.mutateAsync({ id: project.id, nuevoCreadorId: Number(selectedNewOwner) });
      setShowTransferModal(false);
    } catch {
      /* el toast lo muestra el hook */
    }
  };

  const tieneVariasImagenes = (project.imagenes?.length ?? 0) > 1;
  const sliderSettings = {
    infinite: tieneVariasImagenes,
    slidesToShow: 1,
    speed: 500,
    autoplay: tieneVariasImagenes,
    autoplaySpeed: 4000,
    arrows: false,
    dots: true,
  };

  const dateInicio = parseDate(project.fecha_inicio);
  const dateFin = parseDate(project.fecha_fin);

  return (
    <div className="min-h-screen text-foreground font-sans relative overflow-x-hidden selection:bg-primary/30">

      {/* Decoración de fondo muy sutil */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <div className="flex relative z-10">
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main id="contenido" tabIndex={-1} className="flex-1 w-full pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <Link to={backUrl} className="inline-block mb-8">
              <Button variant="outline" className="flex items-center gap-2 rounded-full border-border/60 hover:bg-muted/50 transition-all shadow-sm">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>

            {project.suspendido && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-4">
                <AlertOctagon className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-destructive text-lg">Proyecto Suspendido</h3>
                  <p className="text-sm text-destructive/90 mt-1 leading-relaxed">
                    Este proyecto se encuentra suspendido.
                    {canTransfer && " Como administrador, transfiere la propiedad para reanudarlo."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── 1. CABECERA: identidad + acción | imagen ── */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-10">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 flex flex-col">
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">
                  {project.nombre}
                </h1>

                {project.descripcion_corta && (
                  <p className="text-lg text-muted-foreground leading-relaxed mb-5">
                    {project.descripcion_corta}
                  </p>
                )}

                {/* Categoría + empresa */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                    {project.categoria || 'Categoría General'}
                  </span>
                  {ownerCompany && (
                    <span className="bg-card border border-border text-foreground text-xs font-bold py-1 pl-1 pr-4 rounded-full flex items-center gap-2.5 shadow-sm uppercase tracking-wider">
                      {ownerCompany.logo_url ? (
                        <img src={ownerCompany.logo_url} alt={ownerCompany.nombre} className="w-9 h-9 rounded-full object-contain bg-white border border-border/60" />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </span>
                      )}
                      {ownerCompany.nombre}
                    </span>
                  )}
                </div>

                {/* ODS a los que aporta el proyecto */}
                {Array.isArray(project.ods) && project.ods.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aporta a los ODS</span>
                    {project.ods.map(id => {
                      const o = ODS_POR_ID[id];
                      if (!o) return null;
                      return (
                        <span
                          key={id}
                          title={o.nombre}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: o.color }}
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">{o.id}</span>
                          <span className="max-w-[9rem] truncate">{o.nombre}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Acción principal en la cabecera */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {canRequestParticipation && (
                    <Button variant="primary" className="flex items-center gap-2 shadow-lg shadow-primary/20" onClick={() => setShowRequestModal(true)}>
                      Solicitar Participación <Send className="w-4 h-4" />
                    </Button>
                  )}
                  {(isOwner || isParticipant) && !project.suspendido && (
                    <Link to={`/grupo-trabajo/${project.id}`}>
                      <Button variant="primary" className="flex items-center gap-2 shadow-lg shadow-primary/20">
                        Ir al Espacio de Trabajo <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  {canTransfer && project.suspendido && (
                    <Button variant="warning" className="flex items-center gap-2" onClick={() => setShowTransferModal(true)}>
                      <RefreshCcw className="w-4 h-4" /> Transferir Proyecto
                    </Button>
                  )}
                  {hasPendingRequest && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-warning-subtle border border-warning/30 text-warning-strong px-4 py-2 text-xs font-bold uppercase tracking-widest">
                      <RefreshCcw className="w-4 h-4 animate-spin-slow" /> Solicitud en revisión
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Imagen — formato horizontal, no domina la vista */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 relative">
                {project.imagenes && project.imagenes.length > 0 ? (
                  <Slider {...sliderSettings}>
                    {project.imagenes.map((img, idx) => (
                      <div key={idx} className="outline-none px-1">
                        <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] aspect-[4/3] bg-muted border border-border/50">
                          <img src={img.url} alt={`${project.nombre} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-primary/5 border border-border/50 flex flex-col items-center justify-center">
                    <Building2 className="w-16 h-16 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">Sin imágenes</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── 2. EL PROBLEMA — ancho completo, justo debajo de la cabecera ── */}
            {project.problema ? (
              <div className="mb-10 rounded-2xl border border-warning/30 bg-warning-subtle p-6">
                <h2 className="text-[10px] font-bold text-warning-strong uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  El problema que resuelve
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {project.problema}
                </p>
              </div>
            ) : isOwner ? (
              <div className="mb-10 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground flex items-center gap-3">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                Aún no describiste el problema que resuelve este proyecto. Los postulantes lo usan como base para su propuesta.
              </div>
            ) : null}

            {/* ── 3. SOBRE EL PROYECTO — contenido | ficha ── */}
            <div className="grid lg:grid-cols-12 gap-8">

              {/* MAIN */}
              <div className="lg:col-span-8 space-y-8">
                {project.descripcion_completa && (
                  <section>
                    <h2 className="text-xl font-bold tracking-tight mb-3">Descripción</h2>
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                      {project.descripcion_completa}
                    </p>
                  </section>
                )}

                <section>
                  <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Documentos y Recursos
                  </h2>
                  {archivos && archivos.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {archivos.map((archivo, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          className="flex items-center justify-between gap-3 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/40 hover:shadow-md transition-all text-left group"
                          onClick={() => archivo.url && openBase64(archivo.url)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                              {archivo.nombre}
                            </span>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-none shadow-sm">
                      <FolderOpen className="w-9 h-9 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No hay documentos adjuntos a este proyecto.</p>
                    </Card>
                  )}
                </section>
              </div>

              {/* RAIL */}
              <aside className="lg:col-span-4 space-y-6">
                {/* Ficha del proyecto: cronograma + presupuesto + participantes + creador */}
                <Card className="p-6 border-none shadow-sm">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Ficha del proyecto</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> Inicio</dt>
                      <dd className="font-semibold">{dateInicio.day} {dateInicio.month} {dateInicio.year}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> Finalización</dt>
                      <dd className="font-semibold text-primary">{dateFin.day} {dateFin.month} {dateFin.year}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4" /> Presupuesto</dt>
                      <dd className="font-semibold text-success-strong">{project.financiamiento ? formatNumber(project.financiamiento) : 'Sin definir'}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> Participantes</dt>
                      <dd className="font-semibold">{participatingUsers.length}</dd>
                    </div>
                    {ownerCompany && (
                      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                        <dt className="flex items-center gap-2 text-muted-foreground"><Building2 className="w-4 h-4" /> Empresa</dt>
                        <dd className="flex items-center gap-2.5 font-semibold min-w-0">
                          {ownerCompany.logo_url ? (
                            <img src={ownerCompany.logo_url} alt={ownerCompany.nombre} className="w-10 h-10 rounded-lg object-contain bg-white border border-border/60 flex-shrink-0" />
                          ) : (
                            <span className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            </span>
                          )}
                          <span className="truncate">{ownerCompany.nombre}</span>
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-3">
                    <Avatar
                      name={creator?.nombre_completo || '?'}
                      src={creator?.foto_url}
                      className="w-10 h-10 rounded-full text-sm border border-primary/20"
                      fallbackClassName="bg-primary/10 text-primary font-bold"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{creator?.nombre_completo || 'Cargando…'}</div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Creador</div>
                    </div>
                  </div>
                </Card>

                {/* Equipo */}
                {participatingUsers.length > 0 && (
                  <Card className="p-6 border-none shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Equipo</h3>
                      <span className="inline-flex items-center bg-info-subtle text-info-strong text-xs font-bold px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 mr-1" /> {participatingUsers.length}
                      </span>
                    </div>
                    <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                      {participatingUsers.map((user, idx) => {
                        if (!user) return null;
                        const userComp = companies.find(c => c.id === user.empresa_id);
                        return (
                          <div key={user.id || idx} className="flex items-center gap-3">
                            <Avatar
                              name={user.nombre_completo}
                              src={user.foto_url}
                              className="w-9 h-9 rounded-full text-xs"
                              fallbackClassName="bg-primary text-primary-foreground font-bold"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-sm truncate">{user.nombre_completo}</div>
                              <div className="text-[10px] font-semibold text-muted-foreground truncate">
                                {userComp?.nombre || (esIndependiente(user) ? 'Independiente' : user.cargo) || 'Miembro'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </aside>
            </div>
          </div>
        </main>
      </div>

      {/* MODALES DE ACCIÓN */}
      <Modal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        titulo="Solicitar participación"
        acciones={
          <>
            <Button variant="ghost" onClick={() => setShowRequestModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={handleRequestParticipation}
              disabled={crearSolicitud.isPending}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {crearSolicitud.isPending ? 'Enviando…' : 'Enviar'}
            </Button>
          </>
        }
      >
        <div className="mb-4 rounded-xl border border-border bg-muted p-4">
          <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Solicitante</p>
          <p className="font-semibold">{currentUser?.nombre_completo}</p>
        </div>

        {usuarioIndependiente && (
          <>
            {project.problema && (
              <div className="mb-4 rounded-xl border border-warning/30 bg-warning-subtle p-4">
                <p className="mb-1 text-xs font-bold uppercase text-warning-strong">El problema a resolver</p>
                <p className="text-sm text-foreground whitespace-pre-line">{project.problema}</p>
              </div>
            )}
            <div className="mb-4">
              <TextArea
                label="Propuesta de solución *"
                placeholder="Describe cómo abordarías el problema de este proyecto..."
                rows={5}
                value={propuesta}
                onChange={(e) => setPropuesta(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <DocumentUpload
                label="Documento de la propuesta (opcional)"
                hint="Adjunta un PDF o imagen que respalde tu propuesta (máx. 6MB)."
                value={propuestaFile}
                onChange={setPropuestaFile}
                onRemove={() => setPropuestaFile(null)}
                maxSizeMB={MAX_CV_MB}
              />
            </div>
            <div className="mb-4">
              <DocumentUpload
                label="Tu CV *"
                hint="Adjunta tu currículum en PDF (máx. 6MB)."
                value={cvFile}
                onChange={setCvFile}
                onRemove={() => setCvFile(null)}
                maxSizeMB={MAX_CV_MB}
              />
            </div>
          </>
        )}

        <TextArea
          label="Mensaje (opcional)"
          placeholder="Explica por qué tu perfil sumaría valor a este proyecto..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Modal>

      <Modal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        titulo="Transferir proyecto"
        acciones={
          <>
            <Button variant="ghost" onClick={() => setShowTransferModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleTransfer} disabled={!selectedNewOwner}>
              Transferir
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Selecciona a un usuario activo de la empresa para que sea el nuevo propietario.
        </p>
        <label htmlFor="nuevo-propietario" className="mb-2 block text-sm font-medium text-foreground">
          Nuevo propietario
        </label>
        <select
          id="nuevo-propietario"
          className="w-full min-h-11 rounded-md border border-input bg-input-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          value={selectedNewOwner}
          onChange={(e) => setSelectedNewOwner(Number(e.target.value))}
        >
          <option value="" disabled>Selecciona un usuario…</option>
          {companyUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre_completo}</option>
          ))}
        </select>
      </Modal>
    </div>
  );
}