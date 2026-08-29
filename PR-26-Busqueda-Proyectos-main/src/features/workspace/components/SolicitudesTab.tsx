import { motion } from 'motion/react';
import {
  Clock, Mail, Briefcase, Building2, UserCheck, UserX, CheckCircle2, FileText, ExternalLink,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Avatar } from '@/shared/components/ui/Avatar';
import type { Company } from '@/features/empresas';
import type { ProyectoSolicitud } from './types';

export function SolicitudesTab({
  projectName,
  pendingJoinRequests,
  loadingRequests,
  allRequests,
  companies,
  suspended,
  onAccept,
  onReject,
  onVerCv,
}: {
  projectName: string;
  pendingJoinRequests: ProyectoSolicitud[];
  loadingRequests: boolean;
  allRequests: ProyectoSolicitud[];
  companies: Company[];
  suspended: boolean;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onVerCv: (base64: string) => void;
}) {
  const processedRequests = allRequests.filter(r => r.estado !== 'pendiente');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">Solicitudes de Participación</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Gestiona quién se une a <strong>{projectName}</strong></p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Badge variant="warning">
            {pendingJoinRequests.length} pendiente{pendingJoinRequests.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="success">
            {allRequests.filter(r => r.estado === 'aceptado').length} aceptadas
          </Badge>
        </div>
      </div>

      {loadingRequests ? (
        <Card className="p-12 text-center border-none shadow-sm">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Cargando solicitudes...</p>
        </Card>
      ) : pendingJoinRequests.length > 0 ? (
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Pendientes de revisión
          </h3>
          {pendingJoinRequests.map((req, i) => {
            const reqCompany = req.usuario?.empresa_id
              ? companies.find(c => c.id === req.usuario!.empresa_id)
              : null;
            return (
              <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="p-0 border-none shadow-sm overflow-hidden relative hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                  <div className="p-6 pl-7">
                    <div className="flex items-start gap-5 justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar
                          name={req.usuario?.nombre_completo ?? '?'}
                          src={req.usuario?.foto_url}
                          className="w-14 h-14 rounded-2xl text-xl shadow-md"
                          fallbackClassName="bg-primary text-primary-foreground font-black"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-lg">{req.usuario?.nombre_completo}</p>
                            <Badge variant="warning" size="sm">Pendiente</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                            <Mail className="w-3.5 h-3.5" />{req.usuario?.correo}
                          </div>
                          {req.usuario?.cargo && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{req.usuario.cargo}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{reqCompany?.nombre ?? 'Independiente'}</span>
                          </div>
                          {req.mensaje && (
                            <div className="mt-3 p-3 bg-muted/60 rounded-xl border border-border/50 text-sm italic text-muted-foreground">
                              "{req.mensaje}"
                            </div>
                          )}
                          {req.propuesta && (
                            <div className="mt-3 p-3 bg-info-subtle rounded-xl border border-info/30 text-sm text-foreground">
                              <p className="text-xs font-bold text-info-strong uppercase tracking-widest mb-1">Propuesta de solución</p>
                              <p className="whitespace-pre-line">{req.propuesta}</p>
                            </div>
                          )}
                          {req.cv_url && (
                            <button
                              onClick={() => onVerCv(req.cv_url!)}
                              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <ExternalLink className="w-3 h-3" />
                              Ver CV del postulante
                            </button>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(req.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {!suspended && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            variant="success"
                            size="sm"
                            className="flex items-center gap-1.5 text-xs font-bold shadow-sm shadow-success/20 hover:scale-[1.02] transition-all"
                            onClick={() => onAccept(req.id)}
                          >
                            <UserCheck className="w-3.5 h-3.5" /> ACEPTAR
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 text-xs text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => onReject(req.id)}
                          >
                            <UserX className="w-3.5 h-3.5" /> Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-16 text-center border-none shadow-sm mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-bold mb-1">Sin solicitudes pendientes</h3>
          <p className="text-muted-foreground text-sm">Cuando alguien quiera unirse al proyecto aparecerá aquí.</p>
        </Card>
      )}

      {/* Processed requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Procesadas</h3>
          <div className="space-y-2">
            {processedRequests.map(req => (
              <Card key={req.id} className={`p-4 border-none shadow-sm ${req.estado === 'rechazado' ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={req.usuario?.nombre_completo ?? '?'}
                      src={req.usuario?.foto_url}
                      className="w-10 h-10 rounded-xl text-sm"
                      fallbackClassName={`font-bold ${req.estado === 'aceptado' ? 'bg-success text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{req.usuario?.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.usuario?.correo}</p>
                    </div>
                  </div>
                  <Badge variant={req.estado === 'aceptado' ? 'success' : 'danger'} className="flex-shrink-0">
                    {req.estado === 'aceptado' ? 'Aceptada' : 'Rechazada'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
