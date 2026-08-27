import { useParams, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Building2, Check, X, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProjectRequests() {
  const { id } = useParams();
  const { projects, companies, users, requests, updateRequest, currentUser } = useApp();

  const project = projects.find(p => p.id === Number(id));
  const projectRequests = requests.filter(r => r.proyecto_id === Number(id));

  if (!project || project.creador_id !== currentUser?.id) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No autorizado</h1>
          <Link to="/dashboard">
            <Button variant="primary">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingRequests = projectRequests.filter(r => r.estado === 'pendiente');
  const processedRequests = projectRequests.filter(r => r.estado !== 'pendiente');

  const handleAccept = (requestId: number) => {
    updateRequest(requestId, 'accepted');
  };

  const handleReject = (requestId: number) => {
    updateRequest(requestId, 'rejected');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={`/grupo-trabajo/${id}`}>
          <Button variant="ghost" className="mb-6 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Proyecto
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Solicitudes de Participación</h1>
          <p className="text-muted-foreground">{project.nombre}</p>
        </motion.div>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Pendientes ({pendingRequests.length})
          </h2>
          
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map(request => {
                const requester = users.find(u => u.id === request.usuario_id);
                const requesterCompany = companies.find(c => c.id === requester?.empresa_id);
                if (!requester) return null;
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                          {requester.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{requester.nombre_completo}</h3>
                          {requesterCompany && (
                            <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                              <Building2 className="w-4 h-4 text-primary" /> {requesterCompany.nombre}
                            </p>
                          )}
                          {requester.cargo && <p className="text-sm text-muted-foreground mb-3">{requester.cargo}</p>}

                          {request.mensaje && (
                            <div className="mb-4 p-4 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Mensaje</div>
                              <div className="text-sm">{request.mensaje}</div>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button variant="success" onClick={() => handleAccept(request.id)} className="flex items-center gap-2">
                              <Check className="w-4 h-4" /> Aceptar
                            </Button>
                            <Button variant="outline" onClick={() => handleReject(request.id)} className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                              <X className="w-4 h-4" /> Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
              <p className="text-muted-foreground">
                Las nuevas solicitudes aparecerán aquí
              </p>
            </Card>
          )}
        </div>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Procesadas ({processedRequests.length})
            </h2>
            
            <div className="space-y-3">
              {processedRequests.map(request => {
                const requester = users.find(u => u.id === request.usuario_id);
                const requesterCompany = companies.find(c => c.id === requester?.empresa_id);
                if (!requester) return null;

                return (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                          {requester.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{requester.nombre_completo}</div>
                          <div className="text-xs text-muted-foreground">
                            {requesterCompany?.nombre} · {new Date(request.fecha_creacion).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          request.estado === 'aceptado'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {request.estado === 'aceptado' ? 'Aceptada' : 'Rechazada'}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
