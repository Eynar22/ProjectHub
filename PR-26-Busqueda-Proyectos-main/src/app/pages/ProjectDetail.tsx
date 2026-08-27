import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import { useApp, type Project } from '../context/AppContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TextArea } from '../components/Input';
import { toast } from 'sonner';
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
  Calendar,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export default function ProjectDetail() {
  const { id } = useParams();
  const { projects, archivedProjects, companies, users, currentUser, createRequest, openBase64, transferProject, requests } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPage = location.state?.from;
  const backUrl = fromPage === 'my-projects' ? '/dashboard/projects' : '/explore';
  const backLabel = fromPage === 'my-projects' ? 'Volver a Mis Proyectos' : 'Volver a Explorar';
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const projectLigero = projects.find(p => p.id === Number(id)) || archivedProjects.find(p => p.id === Number(id));

  const [projectCompleto, setProjectCompleto] = useState<Project | null>(null);
  useEffect(() => {
    setProjectCompleto(null);
    if (!id) return;
    api.get<Project>(`/proyectos/${id}`).then(setProjectCompleto).catch(() => {});
  }, [id]);

  const project = projectCompleto ?? projectLigero;
  const creator = project ? users.find(u => u.id === project.creador_id) : null;
  const ownerCompany = creator ? companies.find(c => c.id === creator.empresa_id) : null;
  const participatingUsers = project?.participantes?.map(p => p.usuario) || [];
  const currentUserCompany = currentUser ? companies.find(c => c.id === currentUser.empresa_id) : null;

  const recursosFolder = project?.recursos?.find(r => r.nombre === 'Recursos' && r.tipo === 'carpeta' && !r.padre_id);

  const getAllFilesInFolder = (folderId: number | undefined): any[] => {
    if (!folderId || !project?.recursos) return [];
    const result: any[] = [];
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
  const hasPendingRequest = requests?.some(r => r.proyecto_id === project?.id && r.usuario_id === currentUser?.id && r.estado === 'pendiente');

  const canRequestParticipation =
    !project?.suspendido &&
    (currentUser?.rol === 'admin' || currentUser?.rol === 'empleado') &&
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

  const handleRequestParticipation = () => {
    if (applying) return;
    setApplying(true);
    createRequest({ proyecto_id: project.id, mensaje: message });
    setTimeout(() => {
      setApplying(false);
      setShowRequestModal(false);
      setMessage('');
      toast.success('Tu solicitud fue enviada');
    }, 1500);
  };

  const handleTransfer = async () => {
    if (!selectedNewOwner) return;
    try {
      await transferProject(project.id, Number(selectedNewOwner));
      setShowTransferModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al transferir.');
    }
  };

  const sliderSettings = {
    className: "side-cover-flow",
    centerMode: true,
    infinite: project.imagenes?.length > 1,
    centerPadding: "60px",
    slidesToShow: 1,
    speed: 700,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: true,
  };

  const dateInicio = parseDate(project.fecha_inicio);
  const dateFin = parseDate(project.fecha_fin);

  return (
    <div className="min-h-screen text-foreground font-sans relative overflow-x-hidden selection:bg-primary/30">
      
      {/* Estilos para el Carrusel con efecto Desvanecimiento y Desenfoque */}
      <style>{`
        .mask-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .side-cover-flow .slick-slide {
          transition: all 0.6s ease-in-out;
          transform: scale(0.75);
          opacity: 0.2;
          filter: blur(4px);
          padding: 15px 0;
        }
        .side-cover-flow .slick-center {
          transform: scale(1.05);
          opacity: 1;
          filter: blur(0);
          z-index: 10;
        }
        .side-cover-flow .slick-dots {
          bottom: -35px;
        }
        .side-cover-flow .slick-dots li button:before {
          color: var(--color-primary);
        }
      `}</style>

      {/* Decoración de fondo muy sutil */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <div className="flex relative z-10">
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main className="flex-1 w-full pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
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

            {/* ==================================================== */}
            {/* SECCIÓN SUPERIOR: Info (Izquierda) | Carrusel (Derecha) */}
            {/* ==================================================== */}
            <div className="grid lg:grid-cols-12 gap-12 items-center mb-16">
              
              {/* IZQUIERDA: Textos, Descripción y Estadísticas */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="lg:col-span-7 flex flex-col"
              >
                {/* Etiquetas */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {project.categoria || 'Categoría General'}
                  </span>
                  {ownerCompany && (
                    <span className="bg-card border border-border text-foreground text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {ownerCompany.nombre}
                    </span>
                  )}
                </div>
                
                {/* Título */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
                  {project.nombre}
                </h1>

                {/* Descripción movida aquí bajo el título */}
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line mb-8">
                  {project.descripcion_completa}
                </p>

                {/* BLOQUE DE ESTADÍSTICAS Y CRONOGRAMA */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                  
                  {/* Cronograma (Línea de tiempo) */}
                  <div className="flex items-center justify-between relative">
                    {/* Fecha Inicio */}
                    <div className="flex flex-col items-center bg-card border border-border/50 rounded-2xl p-4 w-[38%] shadow-sm z-10">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Inicio</span>
                      <span className="text-3xl lg:text-4xl font-black text-foreground">{dateInicio.day}</span>
                      <span className="text-xs font-bold text-foreground mt-1">{dateInicio.month} {dateInicio.year}</span>
                    </div>

                    {/* Línea Conectora con Flecha */}
                    <div className="flex-1 flex items-center justify-center relative z-0 px-2">
                      <div className="w-full h-[2px] bg-border/60 relative">
                        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border border-border/50 shadow-sm text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Duración
                        </div>
                        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Fecha Fin */}
                    <div className="flex flex-col items-center bg-card border border-border/50 rounded-2xl p-4 w-[38%] shadow-sm z-10">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Finalización</span>
                      <span className="text-3xl lg:text-4xl font-black text-primary">{dateFin.day}</span>
                      <span className="text-xs font-bold text-foreground mt-1">{dateFin.month} {dateFin.year}</span>
                    </div>
                  </div>

                  {/* Presupuesto y Participantes */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Presupuesto */}
                    <div className="flex items-center gap-4 bg-success/5 border border-success/30 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-success-strong" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Presupuesto</div>
                        <div className="text-2xl font-black text-success-strong">
                          {project.financiamiento ? formatNumber(project.financiamiento) : '--'}
                        </div>
                      </div>
                    </div>

                    {/* Participantes */}
                    <div className="flex items-center gap-4 bg-info-subtle border border-info/30 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-full bg-info-subtle flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-info-strong" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Usuarios</div>
                        <div className="text-2xl font-black text-info-strong">
                          {participatingUsers.length}
                        </div>
                      </div>
                    </div>
                    {/* Acciones (Botones) */}
                <div className="space-y-4 pt-2">
                  {canRequestParticipation && (
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl py-4 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      Solicitar Participación <Send className="w-4 h-4" />
                    </button>
                  )}

                  {canTransfer && project.suspendido && (
                    <button 
                      onClick={() => setShowTransferModal(true)}
                      className="w-full bg-warning/10 hover:bg-warning/20 text-warning rounded-2xl py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 border border-warning/30"
                    >
                      <RefreshCcw className="w-4 h-4" /> Transferir Proyecto
                    </button>
                  )}

                  {hasPendingRequest && (
                    <div className="p-4 rounded-2xl bg-warning-subtle border border-warning/30 text-warning-strong text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <RefreshCcw className="w-4 h-4 animate-spin-slow" />
                      Solicitud en Revisión
                    </div>
                  )}

                  {(isOwner || isParticipant) && !project.suspendido && (
                    <Link to={`/grupo-trabajo/${project.id}`} className="block">
                      <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl py-4 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        Ir al Espacio de Trabajo <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </div>
                  </div>

                </div>
              </motion.div>

              {/* DERECHA: Carrusel de Imágenes */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="lg:col-span-5 relative"
              >
                <div className="mask-edges pb-8">
                  {project.imagenes && project.imagenes.length > 0 ? (
                    <Slider {...sliderSettings}>
                      {project.imagenes.map((img, idx) => (
                        <div key={idx} className="outline-none px-2">
                          <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] aspect-[4/5] md:aspect-[3/4] bg-muted border border-border/50">
                            <img 
                              src={img.url} 
                              alt={`${project.nombre} ${idx + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        </div>
                      ))}
                    </Slider>
                  ) : (
                    <div className="w-full aspect-[4/5] md:aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 flex flex-col items-center justify-center shadow-lg">
                      <Building2 className="w-20 h-20 text-muted-foreground/30 mb-4" />
                      <p className="text-sm font-semibold text-muted-foreground">Sin imágenes</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ==================================================== */}
            {/* SECCIÓN INFERIOR: Documentos y Administración        */}
            {/* ==================================================== */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* COLUMNA IZQUIERDA INFERIOR (Recursos) */}
              <div className="lg:col-span-8">
                {archivos && archivos.length > 0 ? (
                  <Card className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <FolderOpen className="w-5 h-5 text-primary" />
                        Documentos y Recursos
                      </h2>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {archivos.map((archivo, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-2xl hover:bg-muted hover:border-primary/30 transition-all cursor-pointer group shadow-sm"
                          onClick={() => archivo.url && openBase64(archivo.url)}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                              {archivo.nombre}
                            </span>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="bg-card/50 border border-border/50 p-8 rounded-3xl flex flex-col items-center justify-center text-center h-full min-h-[200px] border-dashed">
                    <FolderOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No hay documentos adjuntos a este proyecto.</p>
                  </Card>
                )}
              </div>

              {/* COLUMNA DERECHA INFERIOR (Administración, Participantes & Botones) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Administración */}
                <Card className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Administración</h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                      {creator?.nombre_completo.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm leading-tight">{creator?.nombre_completo || 'Cargando...'}</div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Creador</div>
                    </div>
                  </div>
                </Card>

                {/* Lista de Participantes */}
                {participatingUsers.length > 0 && (
                  <Card className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Participantes</h3>
                      <div className="flex items-center justify-center bg-info-subtle text-info-strong text-xs font-bold px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 mr-1" /> {participatingUsers.length}
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      {participatingUsers.map((user, idx) => {
                        if (!user) return null;
                        const userComp = companies.find(c => c.id === user.empresa_id);
                        return (
                          <div key={user.id || idx} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm flex-shrink-0">
                              {user.nombre_completo.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground text-sm truncate">{user.nombre_completo}</div>
                              <div className="text-[10px] font-semibold text-muted-foreground truncate mt-0.5">
                                {userComp?.nombre || user.cargo || 'Miembro'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODALES DE ACCIÓN */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-modal p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
            <Card className="p-8 rounded-[2rem] shadow-2xl border-border/50 bg-card">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Solicitar Participación</h2>
              <div className="mb-6 space-y-3 bg-muted p-5 rounded-2xl border border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Solicitante</p>
                  <p className="font-semibold text-foreground">{currentUser?.nombre_completo}</p>
                </div>
              </div>
              <TextArea
                label="Mensaje (opcional)"
                placeholder="Explica por qué tu perfil sumaría valor a este proyecto..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex gap-3 mt-8">
                <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setShowRequestModal(false)}>Cancelar</Button>
                <Button variant="primary" className="flex-1 rounded-2xl flex items-center justify-center gap-2" onClick={handleRequestParticipation} disabled={applying}>
                  <Send className="w-4 h-4" /> {applying ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-modal p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
            <Card className="p-8 rounded-[2rem] shadow-2xl border-border/50 bg-card">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Transferir Proyecto</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Selecciona a un usuario activo de la empresa para que sea el nuevo propietario.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground">Nuevo Propietario</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary outline-none transition-all cursor-pointer font-medium"
                    value={selectedNewOwner}
                    onChange={(e) => setSelectedNewOwner(Number(e.target.value))}
                  >
                    <option value="" disabled>Seleccione un usuario...</option>
                    {companyUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setShowTransferModal(false)}>Cancelar</Button>
                <Button variant="primary" className="flex-1 rounded-2xl" onClick={handleTransfer} disabled={!selectedNewOwner}>
                  Transferir
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}