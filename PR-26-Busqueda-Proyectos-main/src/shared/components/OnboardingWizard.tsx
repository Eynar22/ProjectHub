import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { usuariosService } from '@/features/usuarios';
import { useApp } from '@/app/context/AppContext';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { X, Rocket, FolderPlus, UserPlus, PartyPopper, Loader2, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Step = 'bienvenida' | 'proyecto' | 'equipo' | 'listo';

interface EmpleadoRow {
  nombre_completo: string;
  correo: string;
  cargo: string;
}

const emptyRow = (): EmpleadoRow => ({ nombre_completo: '', correo: '', cargo: '' });

export function OnboardingWizard() {
  const { currentUser, refreshCurrentUser, createProject } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('bienvenida');
  const [closed, setClosed] = useState(false);

  const [projectForm, setProjectForm] = useState({ nombre: '', descripcion_corta: '', fecha_fin: '' });
  const [creatingProject, setCreatingProject] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const [empleados, setEmpleados] = useState<EmpleadoRow[]>([emptyRow()]);
  const [addingTeam, setAddingTeam] = useState(false);
  const [teamAdded, setTeamAdded] = useState(0);

  const markOnboardingDone = async () => {
    try {
      await usuariosService.marcarOnboardingCompletado();
    } catch {
      // No bloquea el cierre del wizard si esto falla; se reintentará en el próximo login.
    }
    await refreshCurrentUser().catch(() => {});
  };

  const handleSkipAll = async () => {
    setClosed(true);
    await markOnboardingDone();
  };

  const handleCreateProject = async () => {
    if (!projectForm.nombre.trim()) { toast.error('Ponle un nombre a tu proyecto'); return; }
    if (!projectForm.fecha_fin) { toast.error('Selecciona una fecha de fin'); return; }

    setCreatingProject(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nuevo = await createProject({
        name: projectForm.nombre.trim(),
        shortDescription: projectForm.descripcion_corta.trim() || projectForm.nombre.trim(),
        description: '',
        startDate: today,
        endDate: projectForm.fecha_fin,
        createdByUserId: currentUser!.id,
      });
      setCreatedProjectId(nuevo.id);
      setStep('equipo');
    } catch {
      // createProject ya muestra el toast con el motivo del error
    } finally {
      setCreatingProject(false);
    }
  };

  const updateEmpleadoRow = (idx: number, field: keyof EmpleadoRow, value: string) => {
    setEmpleados(prev => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const addEmpleadoRow = () => setEmpleados(prev => [...prev, emptyRow()]);
  const removeEmpleadoRow = (idx: number) => setEmpleados(prev => prev.filter((_, i) => i !== idx));

  const handleFinishTeam = async () => {
    const validRows = empleados.filter(r => r.nombre_completo.trim() && r.correo.trim());

    if (validRows.length === 0) {
      setStep('listo');
      await markOnboardingDone();
      return;
    }

    setAddingTeam(true);
    let success = 0;
    for (const row of validRows) {
      try {
        await usuariosService.crearRapido({
          nombre_completo: row.nombre_completo.trim(),
          correo: row.correo.trim(),
          cargo: row.cargo.trim() || undefined,
          proyecto_id: createdProjectId,
        });
        success++;
      } catch (err) {
        toast.error(err instanceof Error ? `${row.correo}: ${err.message}` : `No se pudo agregar a ${row.correo}`);
      }
    }
    setTeamAdded(success);
    setAddingTeam(false);
    setStep('listo');
    await markOnboardingDone();
  };

  const handleSkipTeam = async () => {
    setStep('listo');
    await markOnboardingDone();
  };

  const handleGoToProject = () => {
    if (createdProjectId) navigate(`/grupo-trabajo/${createdProjectId}`);
  };

  if (closed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg">
        <Card className="p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">
          {step !== 'listo' && (
            <button
              type="button"
              onClick={handleSkipAll}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors"
              title="Omitir"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {step === 'bienvenida' && (
              <motion.div key="bienvenida" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">¡Bienvenido a ProjectHub, {currentUser?.nombre_completo?.split(' ')[0]}!</h2>
                <p className="text-muted-foreground mb-8">
                  Tu empresa ya fue aprobada. Vamos a crear tu primer proyecto y agregar a tu equipo en un par de pasos rápidos.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="ghost" onClick={handleSkipAll}>Omitir por ahora</Button>
                  <Button variant="primary" onClick={() => setStep('proyecto')} className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" /> Crear mi primer proyecto
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'proyecto' && (
              <motion.div key="proyecto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <FolderPlus className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Crea tu primer proyecto</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Puedes completar el resto de los detalles después, desde el proyecto.</p>

                <div className="space-y-4">
                  <Input
                    label="Nombre del proyecto"
                    placeholder="Ej. Sistema de Inventario"
                    value={projectForm.nombre}
                    onChange={(e) => setProjectForm(f => ({ ...f, nombre: e.target.value }))}
                  />
                  <TextArea
                    label="Descripción corta (opcional)"
                    placeholder="¿De qué trata el proyecto?"
                    rows={2}
                    value={projectForm.descripcion_corta}
                    onChange={(e) => setProjectForm(f => ({ ...f, descripcion_corta: e.target.value }))}
                  />
                  <Input
                    label="Fecha de fin estimada"
                    type="date"
                    value={projectForm.fecha_fin}
                    onChange={(e) => setProjectForm(f => ({ ...f, fecha_fin: e.target.value }))}
                  />
                </div>

                <div className="flex justify-between items-center mt-8">
                  <button type="button" onClick={handleSkipAll} className="text-sm text-muted-foreground hover:text-foreground">
                    Omitir todo
                  </button>
                  <Button variant="primary" onClick={handleCreateProject} disabled={creatingProject} className="flex items-center gap-2">
                    {creatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Crear y continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'equipo' && (
              <motion.div key="equipo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Agrega a tu equipo</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Se crearán como empleados de tu empresa y quedarán asignados a este proyecto. Les enviaremos una contraseña temporal por correo.
                </p>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {empleados.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                      <Input
                        placeholder="Nombre completo"
                        value={row.nombre_completo}
                        onChange={(e) => updateEmpleadoRow(idx, 'nombre_completo', e.target.value)}
                      />
                      <Input
                        placeholder="correo@empresa.com"
                        type="email"
                        value={row.correo}
                        onChange={(e) => updateEmpleadoRow(idx, 'correo', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeEmpleadoRow(idx)}
                        disabled={empleados.length === 1}
                        className="mt-2 p-2 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Quitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addEmpleadoRow}
                  className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar otro
                </button>

                <div className="flex justify-between items-center mt-8">
                  <button type="button" onClick={handleSkipTeam} className="text-sm text-muted-foreground hover:text-foreground">
                    Omitir este paso
                  </button>
                  <Button variant="primary" onClick={handleFinishTeam} disabled={addingTeam} className="flex items-center gap-2">
                    {addingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Finalizar
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'listo' && (
              <motion.div key="listo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PartyPopper className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">¡Todo listo!</h2>
                <p className="text-muted-foreground mb-8">
                  {createdProjectId
                    ? teamAdded > 0
                      ? `Tu proyecto fue creado y ${teamAdded} ${teamAdded === 1 ? 'persona' : 'personas'} ya recibieron su acceso por correo.`
                      : 'Tu proyecto fue creado. Puedes agregar colaboradores cuando quieras desde su espacio de trabajo.'
                    : 'Puedes crear tu primer proyecto cuando quieras desde el Dashboard.'}
                </p>
                <Button variant="primary" onClick={createdProjectId ? handleGoToProject : () => setClosed(true)} className="w-full">
                  {createdProjectId ? 'Ir a mi proyecto' : 'Empezar a explorar'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
