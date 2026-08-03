import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TextArea } from '../components/Input';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Users,
  ArrowLeft,
  Send,
  Download,
  AlertOctagon,
  RefreshCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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

  const project = projects.find(p => p.id === Number(id)) || archivedProjects.find(p => p.id === Number(id));
  const creator = project ? users.find(u => u.id === project.creador_id) : null;
  const ownerCompany = creator ? companies.find(c => c.id === creator.empresa_id) : null;
  const participatingUsers = project?.participantes?.map(p => p.usuario) || [];
  const currentUserCompany = currentUser ? companies.find(c => c.id === currentUser.empresa_id) : null;

  // Get files inside Recursos folder recursively
  const recursosFolder = project?.recursos?.find(r => r.nombre === 'Recursos' && r.tipo === 'carpeta' && !r.padre_id);

  // Function to get all files recursively inside a folder
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

  const isCompanyAdmin = currentUser?.rol === 'admin' && currentUser.empresa_id === ownerCompany?.id;
  const canTransfer = currentUser?.rol === 'superadmin';
  const companyUsers = users.filter(u => u.empresa_id === ownerCompany?.id && u.estado === 'activo' && u.id !== creator?.id);

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
          <Link to="/explore">
            <Button variant="primary">Volver a Explorar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRequestParticipation = () => {
    if (applying) return;
    setApplying(true);
    createRequest({
      proyecto_id: project.id,
      mensaje: message
    });

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
      toast.error(error.message || 'Error al transferir el proyecto. Inténtalo de nuevo.');
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />

      <div className="flex">
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Button */}
            <Link to={backUrl}>
              <Button variant="ghost" className="mb-6 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-4xl font-bold">{project.nombre}</h1>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mt-2">
                      {project.categoria || 'Tecnología'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{creator?.nombre_completo || 'Cargando creador...'}{ownerCompany ? ` · ${ownerCompany.nombre}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{project.fecha_inicio} - {project.fecha_fin}</span>
                    </div>
                  </div>

                  {project.suspendido && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                      <AlertOctagon className="w-6 h-6 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-destructive">Proyecto Suspendido</h3>
                        <p className="text-sm text-destructive/90">
                          Este proyecto se encuentra suspendido porque el acceso de su creador ha sido bloqueado.
                          {canTransfer && " Como administrador, puedes transferir la propiedad del proyecto a otro usuario activo para reanudarlo."}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Images */}
                <Card className="overflow-hidden">
                  <div className="h-96">
                    {project.imagenes && project.imagenes.length > 0 ? (
                      <Slider {...sliderSettings}>
                        {project.imagenes.map((img, idx) => (
                          <div key={idx}>
                            <img
                              src={img.url}
                              alt={`${project.nombre} ${idx + 1}`}
                              className="w-full h-96 object-cover"
                            />
                          </div>
                        ))}
                      </Slider>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Description */}
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Descripción del Proyecto</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {project.descripcion_completa}
                  </p>
                </Card>

                {/* Resources */}
                {archivos && archivos.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Recursos</h2>
                    <div className="space-y-2">
                      {archivos.map((archivo, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors cursor-pointer group"
                          onClick={() => archivo.url && openBase64(archivo.url)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-destructive flex-shrink-0" />
                            <span className="truncate">{archivo.nombre}</span>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Participating Users */}
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Usuarios Participantes ({participatingUsers.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {participatingUsers.map(user => {
                      if (!user) return null;
                      const userComp = companies.find(c => c.id === user.empresa_id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-4 bg-muted rounded-lg"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                            {user.nombre_completo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{user.nombre_completo}</div>
                            {user.cargo && <div className="text-xs text-muted-foreground">{user.cargo}</div>}
                            {userComp && <div className="text-sm text-muted-foreground">{userComp.nombre}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Project Info Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Información del Proyecto</h3>

                  <div className="space-y-4">
                    {project.financiamiento && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Financiamiento</div>
                        <div className="flex items-center gap-2 text-2xl font-bold text-success">
                          <DollarSign className="w-6 h-6" />
                          {project.financiamiento.toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Creado por</div>
                      <div className="font-semibold">{creator?.nombre_completo}</div>
                      {ownerCompany && <div className="text-xs text-muted-foreground">{ownerCompany.nombre}</div>}
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fecha de Inicio</div>
                      <div className="font-semibold">{project.fecha_inicio}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fecha de Finalización</div>
                      <div className="font-semibold">{project.fecha_fin}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Participantes</div>
                      <div className="font-semibold">{participatingUsers.length}</div>
                    </div>
                  </div>
                </Card>

                {/* Action Button */}
                {canRequestParticipation && (
                  <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
                    <h3 className="text-lg font-semibold mb-2">¿Te interesa participar?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Envía una solicitud para unirte a este proyecto
                    </p>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowRequestModal(true)}
                    >
                      Solicitar Participación
                    </Button>
                  </Card>
                )}

                {canTransfer && project.suspendido && (
                  <Card className="p-6 border-warning/50 bg-warning/5">
                    <h3 className="text-lg font-semibold mb-2 text-warning flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5" />
                      Transferir Propiedad
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Asigna este proyecto a otro usuario de la empresa para descongelarlo.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-warning text-warning hover:bg-warning/10"
                      onClick={() => setShowTransferModal(true)}
                    >
                      Transferir Proyecto
                    </Button>
                  </Card>
                )}

                {hasPendingRequest && (
                  <Card className="p-6 border-amber-200 bg-amber-50">
                    <h3 className="text-lg font-semibold mb-2 text-amber-700 flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5 animate-spin-slow" />
                      Solicitud Pendiente
                    </h3>
                    <p className="text-sm text-amber-600">
                      Ya has enviado una solicitud para unirte a este proyecto. El propietario la revisará pronto.
                    </p>
                  </Card>
                )}

                {(isOwner || isParticipant) && !project.suspendido && (
                  <Card className="p-6 bg-gradient-to-br from-accent/10 to-success/10 border-accent/20">
                    <h3 className="text-lg font-semibold mb-4">
                      {isOwner ? 'Gestiona tu Proyecto' : 'Eres Colaborador'}
                    </h3>
                    <Link to={`/grupo-trabajo/${project.id}`}>
                      <Button variant="accent" className="w-full shadow-lg shadow-accent/20">
                        Ir al Grupo de Trabajo
                      </Button>
                    </Link>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Solicitar Participación</h2>

              <div className="mb-4 space-y-2 bg-muted p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Solicitante</p>
                  <p className="font-semibold">{currentUser?.nombre_completo}</p>
                </div>
                {currentUserCompany && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Empresa</p>
                    <p className="font-medium">{currentUserCompany.nombre}</p>
                  </div>
                )}
                {currentUser?.cargo && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Cargo</p>
                    <p className="text-sm">{currentUser.cargo}</p>
                  </div>
                )}
              </div>

              <TextArea
                label="Mensaje (opcional)"
                placeholder="Explica por qué crees que tu aporte sería de utilidad para el proyecto..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleRequestParticipation}
                  disabled={applying}
                >
                  <Send className="w-4 h-4" />
                  {applying ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Transferir Proyecto</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Selecciona a un usuario activo de la empresa para que se convierta en el nuevo propietario de este proyecto. Esto descongelará el proyecto automáticamente.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nuevo Propietario</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={selectedNewOwner}
                    onChange={(e) => setSelectedNewOwner(Number(e.target.value))}
                  >
                    <option value="" disabled>Seleccione un usuario...</option>
                    {companyUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre_completo} - {u.cargo || 'Sin cargo'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowTransferModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleTransfer}
                  disabled={!selectedNewOwner}
                >
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
