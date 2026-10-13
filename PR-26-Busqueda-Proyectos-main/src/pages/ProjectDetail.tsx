import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LIMITES, CAMPOS, validarCampos, primerError } from '@/shared/validacion';
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
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { TextArea } from '@/shared/components/ui/Input';
import { DocumentUpload } from '@/shared/components/ui/DocumentUpload';
import { useDocumentTitle } from '@/shared/utils/useDocumentTitle';
import { esIndependiente } from '@/shared/utils/roles';
import { Avatar } from '@/shared/components/ui/Avatar';
import { ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import s from '@/pages/proyecto/Detalle.module.css';
import { FotosHero, Revelar } from '@/pages/proyecto/piezas';

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
  const [hoy] = useState(() => Date.now());
  // La barra fija con la acción principal se muestra cuando la cabecera sale de la pantalla.
  const cabecera = useRef<HTMLElement>(null);
  const [verBarra, setVerBarra] = useState(false);
  useEffect(() => {
    const el = cabecera.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVerBarra(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  });

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
    const error = primerError(validarCampos({ propuesta, message }, {
      ...(usuarioIndependiente ? { propuesta: CAMPOS.propuesta } : {}),
      message: CAMPOS.mensaje_solicitud,
    }));
    if (error) { toast.error(error); return; }
    if (usuarioIndependiente && !cvFile) { toast.error('Adjunta tu CV en PDF'); return; }

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

  const dateInicio = parseDate(project.fecha_inicio);
  const dateFin = parseDate(project.fecha_fin);

  // Cifras del proyecto (para la fila de cifras grandes y la ficha).
  const DIA = 864e5;
  const tInicio = project.fecha_inicio ? new Date(project.fecha_inicio + 'T00:00:00').getTime() : NaN;
  const tFin = project.fecha_fin ? new Date(project.fecha_fin + 'T00:00:00').getTime() : NaN;
  const duracionDias = Number.isFinite(tInicio) && Number.isFinite(tFin) ? Math.max(0, Math.round((tFin - tInicio) / DIA)) : null;
  const diasRestantes = Number.isFinite(tFin) ? Math.ceil((tFin - hoy) / DIA) : null;
  const avance = duracionDias && Number.isFinite(tInicio) ? Math.min(100, Math.max(0, ((hoy - tInicio) / (tFin - tInicio)) * 100)) : 0;
  const duracionTexto = duracionDias == null ? '—'
    : duracionDias >= 60 ? `${Math.round(duracionDias / 30)}` : `${duracionDias}`;
  const duracionUnidad = duracionDias == null ? '' : duracionDias >= 60 ? 'meses' : 'días';
  const fotos = (project.imagenes ?? []).map(i => i.url).filter(Boolean);
  const titulo = project.nombre.split(' ');

  return (
    <div className={s.raiz}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main id="contenido" tabIndex={-1} style={{ flex: 1, minWidth: 0 }}>
          <div className={s.contenedor}>
            <Link to={backUrl} className={s.volver}><ArrowLeft size={17} /> {backLabel}</Link>

            {project.suspendido && (
              <div className={`${s.alerta} ${s.aparece}`} role="alert">
                <AlertOctagon size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h2>Proyecto suspendido</h2>
                  <p>Este proyecto se encuentra suspendido.{canTransfer && ' Como administrador, transfiere la propiedad para reanudarlo.'}</p>
                </div>
              </div>
            )}

            {/* ── CABECERA: imagen | ficha (todo lo esencial en la primera pantalla) ── */}
            <header ref={cabecera} className={s.cabecera}>
              <div className={`${s.hero} ${s.aparece}`}>
                <FotosHero fotos={fotos} nombre={project.nombre} />
              </div>

              <div className={s.info}>
                <div className={`${s.etiquetas} ${s.aparece}`} style={{ animationDelay: '.05s' }}>
                  <span className={`${s.etiqueta} ${s.etiquetaMarca}`}>{project.categoria || 'Proyecto'}</span>
                  {ownerCompany && (
                    <Link to={`/empresa/${ownerCompany.id}`} className={s.etiqueta}>
                      {ownerCompany.logo_url ? <img src={ownerCompany.logo_url} alt="" /> : <Building2 size={16} aria-hidden="true" />}
                      {ownerCompany.nombre}
                    </Link>
                  )}
                </div>
                <h1 className={s.titulo}>
                  {titulo.map((w, i) => <span key={i} className={s.w} style={{ animationDelay: `${0.15 + i * 0.07}s` }}>{w} </span>)}
                </h1>
                {project.descripcion_corta && (
                  <p className={`${s.bajada} ${s.aparece}`} style={{ animationDelay: '.45s' }}>{project.descripcion_corta}</p>
                )}
                <div className={`${s.estados} ${s.aparece}`} style={{ animationDelay: '.55s' }}>
                <span className={s.estado}><Users size={14} aria-hidden="true" /> {participatingUsers.length} {participatingUsers.length === 1 ? 'participante' : 'participantes'}</span>
                {diasRestantes != null && (
                  diasRestantes > 0
                    ? <span className={`${s.estado} ${diasRestantes <= 15 ? s.estadoAviso : s.estadoBien}`}><Clock size={14} aria-hidden="true" /> {diasRestantes === 1 ? 'Termina mañana' : `Termina en ${diasRestantes} días`}</span>
                    : <span className={s.estado}><Clock size={14} aria-hidden="true" /> Finalizado</span>
                )}
                </div>
                <div className={`${s.botones} ${s.aparece}`} style={{ animationDelay: '.65s' }}>
                {canRequestParticipation && (
                  <button type="button" className={s.btn} onClick={() => setShowRequestModal(true)}>
                    Solicitar participación <Send size={16} />
                  </button>
                )}
                {(isOwner || isParticipant) && !project.suspendido && (
                  <Link to={`/grupo-trabajo/${project.id}`} className={s.btn}>Ir al espacio de trabajo <ArrowRight size={16} /></Link>
                )}
                {canTransfer && project.suspendido && (
                  <button type="button" className={`${s.btn} ${s.btnAviso}`} onClick={() => setShowTransferModal(true)}>
                    <RefreshCcw size={16} /> Transferir proyecto
                  </button>
                )}
                {hasPendingRequest && (
                  <span className={s.pendiente}><RefreshCcw size={16} className={s.girar} /> Solicitud en revisión</span>
                )}
                </div>

                <div className={`${s.cifras} ${s.aparece}`} style={{ animationDelay: '.75s' }}>
                  <div className={s.cifra}><b>{duracionTexto}<small> {duracionUnidad}</small></b><span>de duración</span></div>
                  <div className={s.cifra}><b>{project.financiamiento ? `$${formatNumber(project.financiamiento)}` : '—'}</b><span>{project.financiamiento ? 'de presupuesto' : 'presupuesto sin definir'}</span></div>
                  <div className={s.cifra}><b>{participatingUsers.length}</b><span>{participatingUsers.length === 1 ? 'persona en el equipo' : 'personas en el equipo'}</span></div>
                  <div className={s.cifra}><b>{project.ods?.length ?? 0}</b><span>{(project.ods?.length ?? 0) === 1 ? 'ODS al que aporta' : 'ODS a los que aporta'}</span></div>
                </div>
              </div>
            </header>

            {/* ── BARRA FIJA: aparece solo cuando la cabecera ya salió de la pantalla ── */}
            <div className={`${s.accion} ${verBarra ? s.accionOn : ''}`} aria-hidden={!verBarra}>
              <span className={s.accionNombre}>{project.nombre}</span>
              <div className={s.estados}>
                <span className={s.estado}><Users size={14} aria-hidden="true" /> {participatingUsers.length} {participatingUsers.length === 1 ? 'participante' : 'participantes'}</span>
                {diasRestantes != null && (
                  diasRestantes > 0
                    ? <span className={`${s.estado} ${diasRestantes <= 15 ? s.estadoAviso : s.estadoBien}`}><Clock size={14} aria-hidden="true" /> {diasRestantes === 1 ? 'Termina mañana' : `Termina en ${diasRestantes} días`}</span>
                    : <span className={s.estado}><Clock size={14} aria-hidden="true" /> Finalizado</span>
                )}
              </div>
              <div className={s.botones} style={{ marginLeft: 'auto' }}>
                {canRequestParticipation && (
                  <button type="button" className={s.btn} onClick={() => setShowRequestModal(true)}>
                    Solicitar participación <Send size={16} />
                  </button>
                )}
                {(isOwner || isParticipant) && !project.suspendido && (
                  <Link to={`/grupo-trabajo/${project.id}`} className={s.btn}>Ir al espacio de trabajo <ArrowRight size={16} /></Link>
                )}
                {canTransfer && project.suspendido && (
                  <button type="button" className={`${s.btn} ${s.btnAviso}`} onClick={() => setShowTransferModal(true)}>
                    <RefreshCcw size={16} /> Transferir proyecto
                  </button>
                )}
                {hasPendingRequest && (
                  <span className={s.pendiente}><RefreshCcw size={16} className={s.girar} /> Solicitud en revisión</span>
                )}
              </div>
            </div>

            {/* ── CUERPO: contenido | ficha ── */}
            <div className={s.cuerpo}>
              <div>
                {project.problema ? (
                  <Revelar className={s.bloque}>
                    <p className={s.eyebrow}><AlertOctagon size={15} aria-hidden="true" /> El problema que resuelve</p>
                    <p className={s.problema}>{project.problema}</p>
                  </Revelar>
                ) : isOwner ? (
                  <Revelar className={s.bloque}>
                    <p className={s.sinProblema}>Aún no describiste el problema que resuelve este proyecto. Los postulantes lo usan como base para su propuesta.</p>
                  </Revelar>
                ) : null}

                {project.descripcion_completa && (
                  <Revelar className={s.bloque}>
                    <p className={s.eyebrow}>Descripción</p>
                    <p className={s.texto}>{project.descripcion_completa}</p>
                  </Revelar>
                )}

                {Array.isArray(project.ods) && project.ods.length > 0 && (
                  <Revelar className={s.bloque}>
                    <p className={s.eyebrow}>Aporta a los ODS</p>
                    <div className={s.ods}>
                      {project.ods.map(odsId => {
                        const o = ODS_POR_ID[odsId];
                        if (!o) return null;
                        return (
                          <Link key={odsId} to={`/explore?ods=${odsId}`} className={s.odsCard} title={etiquetaOds(o.id)} style={{ '--c': o.color } as CSSProperties}>
                            <img src={`/images/ods/${o.id}.png`} alt="" />
                            <div><b>ODS {o.id}</b><span>{o.nombre}</span></div>
                          </Link>
                        );
                      })}
                    </div>
                  </Revelar>
                )}

                <Revelar className={s.bloque}>
                  <p className={s.eyebrow}><FolderOpen size={15} aria-hidden="true" /> Documentos y recursos</p>
                  {archivos && archivos.length > 0 ? (
                    <div className={s.docs}>
                      {archivos.map((archivo, idx: number) => (
                        <button key={idx} type="button" className={s.doc} onClick={() => archivo.url && openBase64(archivo.url)}>
                          <i><FileText size={19} /></i>
                          <span>{archivo.nombre}</span>
                          <Download size={17} className={s.bajar} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={s.vacio}>No hay documentos adjuntos a este proyecto.</p>
                  )}
                </Revelar>
              </div>

              {/* FICHA LATERAL */}
              <aside className={s.ficha}>
                <Revelar className={s.panel}>
                  <h3>Cronograma</h3>
                  <div className={s.fechas}>
                    <div className={s.fecha}><b>{dateInicio.day}</b><small>{dateInicio.month} {dateInicio.year}</small></div>
                    <ArrowRight size={18} className={s.flechaFechas} aria-hidden="true" />
                    <div className={`${s.fecha} ${s.fechaFin}`}><b>{dateFin.day}</b><small>{dateFin.month} {dateFin.year}</small></div>
                  </div>
                  <div className={s.progreso} aria-hidden="true"><i style={{ width: `${avance}%` }} /></div>
                  <p className={s.progresoTxt}>{avance >= 100 ? 'Plazo cumplido' : avance <= 0 ? 'Aún no comienza' : `${Math.round(avance)}% del plazo transcurrido`}</p>

                  <div className={s.separador} />
                  {ownerCompany && (
                    <Link to={`/empresa/${ownerCompany.id}`} className={s.persona}>
                      {ownerCompany.logo_url
                        ? <img src={ownerCompany.logo_url} alt="" className={s.logoEmp} />
                        : <Building2 size={22} aria-hidden="true" />}
                      <div style={{ minWidth: 0 }}><b>{ownerCompany.nombre}</b><small>Empresa</small></div>
                    </Link>
                  )}
                  <div className={s.separador} />
                  <div className={s.persona}>
                    <Avatar name={creator?.nombre_completo || '?'} src={creator?.foto_url} className="w-11 h-11 rounded-full text-sm" fallbackClassName="bg-primary/10 text-primary font-bold" />
                    <div style={{ minWidth: 0 }}><b>{creator?.nombre_completo || 'Cargando…'}</b><small>Creador</small></div>
                  </div>
                </Revelar>

                {participatingUsers.length > 0 && (
                  <Revelar className={s.panel} retraso={0.1}>
                    <h3>Equipo · {participatingUsers.length}</h3>
                    <div className={s.avatares}>
                      {participatingUsers.slice(0, 7).map((user, idx) => user && (
                        <Avatar key={user.id || idx} name={user.nombre_completo} src={user.foto_url} className="w-11 h-11 rounded-full text-xs" fallbackClassName="bg-primary text-primary-foreground font-bold" />
                      ))}
                    </div>
                    <div className={s.miembros}>
                      {participatingUsers.map((user, idx) => {
                        if (!user) return null;
                        const userComp = companies.find(c => c.id === user.empresa_id);
                        const esCreador = user.id === project.creador_id;
                        return (
                          <div key={user.id || idx} className={s.miembro}>
                            <Avatar name={user.nombre_completo} src={user.foto_url} className="w-9 h-9 rounded-full text-xs" fallbackClassName="bg-primary text-primary-foreground font-bold" />
                            <div style={{ minWidth: 0 }}>
                              <b>{user.nombre_completo}</b>{esCreador && <span className={s.creadorTag}>Creador</span>}
                              <small>{userComp?.nombre || (esIndependiente(user) ? 'Independiente' : user.cargo) || 'Miembro'}</small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Revelar>
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
                value={propuesta} maxLength={LIMITES.solicitud.propuesta}
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
          value={message} maxLength={LIMITES.solicitud.mensaje}
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
