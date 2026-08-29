import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { usuariosService } from '@/features/usuarios';
import { useApp } from '@/app/context/AppContext';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { X, Rocket, FolderPlus, UserPlus, PartyPopper, Loader2, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECT_CATEGORIES } from '@/shared/constants/proyecto';
import { ODS_LIST } from '@/shared/constants/ods';

type Step = 'bienvenida' | 'proyecto' | 'equipo' | 'listo';

interface EmpleadoRow {
  nombre_completo: string;
  correo: string;
  cargo: string;
}

const emptyRow = (): EmpleadoRow => ({ nombre_completo: '', correo: '', cargo: '' });

const TOTAL_SUBPASOS = 3;

export function OnboardingWizard() {
  const { currentUser, refreshCurrentUser, createProject } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('bienvenida');
  const [closed, setClosed] = useState(false);

  // Sub-paso del formulario de proyecto (1..3): el formulario completo se
  // reparte para que ninguna pantalla sea larga.
  const [subPaso, setSubPaso] = useState(1);

  const [projectForm, setProjectForm] = useState({
    nombre: '',
    descripcion_corta: '',
    descripcion: '',
    problema: '',
    categoria: 'Tecnología',
    fecha_fin: '',
    financiamiento: '',
    ods: [] as number[],
  });
  const [creatingProject, setCreatingProject] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const [empleados, setEmpleados] = useState<EmpleadoRow[]>([emptyRow()]);
  const [addingTeam, setAddingTeam] = useState(false);
  const [teamAdded, setTeamAdded] = useState(0);

  const setField = <K extends keyof typeof projectForm>(field: K, value: (typeof projectForm)[K]) =>
    setProjectForm(f => ({ ...f, [field]: value }));

  const toggleOds = (id: number) =>
    setProjectForm(f => ({
      ...f,
      ods: f.ods.includes(id) ? f.ods.filter(x => x !== id) : [...f.ods, id],
    }));

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

  /** Valida solo los campos del sub-paso actual. Devuelve true si puede avanzar. */
  const validarSubPaso = (n: number): boolean => {
    if (n === 1) {
      if (!projectForm.nombre.trim()) { toast.error('Ponle un nombre a tu proyecto'); return false; }
      if (!projectForm.descripcion_corta.trim()) { toast.error('Escribe una descripción corta'); return false; }
      return true;
    }
    if (n === 2) {
      if (!projectForm.descripcion.trim()) { toast.error('Describe el proyecto en detalle'); return false; }
      if (!projectForm.problema.trim()) { toast.error('Describe el problema que resuelve el proyecto'); return false; }
      return true;
    }
    if (n === 3) {
      if (!projectForm.fecha_fin) { toast.error('Selecciona una fecha de fin'); return false; }
      if (projectForm.financiamiento && parseFloat(projectForm.financiamiento) < 0) {
        toast.error('El financiamiento no puede ser negativo'); return false;
      }
      return true;
    }
    return true;
  };

  const avanzarSubPaso = () => {
    if (!validarSubPaso(subPaso)) return;
    if (subPaso < TOTAL_SUBPASOS) setSubPaso(subPaso + 1);
    else handleCreateProject();
  };

  const retrocederSubPaso = () => {
    if (subPaso > 1) setSubPaso(subPaso - 1);
    else setStep('bienvenida');
  };

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nuevo = await createProject({
        name: projectForm.nombre.trim(),
        shortDescription: projectForm.descripcion_corta.trim(),
        description: projectForm.descripcion.trim(),
        problema: projectForm.problema.trim(),
        categoria: projectForm.categoria,
        ods: projectForm.ods,
        startDate: today,
        endDate: projectForm.fecha_fin,
        funding: projectForm.financiamiento || undefined,
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
                  <Button variant="primary" onClick={() => { setSubPaso(1); setStep('proyecto'); }} className="flex items-center gap-2">
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
                <div className="flex items-center gap-2 mb-6">
                  <p className="text-sm text-muted-foreground">Paso {subPaso} de {TOTAL_SUBPASOS}</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: TOTAL_SUBPASOS }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-6 rounded-full transition-colors ${i < subPaso ? 'bg-primary' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {subPaso === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                      <Input
                        label="Nombre del proyecto"
                        placeholder="Ej. Sistema de Inventario"
                        value={projectForm.nombre}
                        onChange={(e) => setField('nombre', e.target.value)}
                      />
                      <TextArea
                        label="Descripción corta"
                        placeholder="Resumen para las tarjetas (máx. ~120 caracteres)"
                        rows={2}
                        value={projectForm.descripcion_corta}
                        onChange={(e) => setField('descripcion_corta', e.target.value)}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">Categoría / Sector</label>
                        <select
                          value={projectForm.categoria}
                          onChange={(e) => setField('categoria', e.target.value)}
                          className="w-full px-4 py-2.5 bg-input-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm"
                        >
                          {PROJECT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {subPaso === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                      <TextArea
                        label="Descripción completa"
                        placeholder="Objetivos, alcance, tecnologías y requerimientos..."
                        rows={4}
                        value={projectForm.descripcion}
                        onChange={(e) => setField('descripcion', e.target.value)}
                      />
                      <TextArea
                        label="El problema que resuelve"
                        placeholder="¿Qué problema concreto aborda este proyecto? Los postulantes lo usan como base para su propuesta."
                        rows={3}
                        value={projectForm.problema}
                        onChange={(e) => setField('problema', e.target.value)}
                      />
                    </motion.div>
                  )}

                  {subPaso === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Fecha de fin estimada"
                          type="date"
                          value={projectForm.fecha_fin}
                          onChange={(e) => setField('fecha_fin', e.target.value)}
                        />
                        <div>
                          <label className="block text-sm font-medium mb-1.5 text-foreground">
                            Financiamiento <span className="text-muted-foreground font-normal">(opcional)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={projectForm.financiamiento}
                              onChange={(e) => setField('financiamiento', e.target.value)}
                              className="w-full pl-7 pr-4 py-2.5 bg-input-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">
                          Objetivos de Desarrollo Sostenible <span className="text-muted-foreground font-normal">(opcional)</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {ODS_LIST.map(o => {
                            const activo = projectForm.ods.includes(o.id);
                            return (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => toggleOds(o.id)}
                                aria-pressed={activo}
                                title={o.nombre}
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                                  activo ? 'text-white border-transparent' : 'bg-input-background text-foreground border-input hover:border-primary/40'
                                }`}
                                style={activo ? { backgroundColor: o.color } : undefined}
                              >
                                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${activo ? 'bg-white/25' : 'bg-muted'}`}>
                                  {o.id}
                                </span>
                                <span className="max-w-[8rem] truncate">{o.nombre}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center mt-8">
                  <button type="button" onClick={retrocederSubPaso} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-3.5 h-3.5" /> Atrás
                  </button>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={handleSkipAll} className="text-sm text-muted-foreground hover:text-foreground">
                      Omitir todo
                    </button>
                    <Button variant="primary" onClick={avanzarSubPaso} disabled={creatingProject} className="flex items-center gap-2">
                      {creatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {subPaso < TOTAL_SUBPASOS ? 'Siguiente' : 'Crear y continuar'}
                    </Button>
                  </div>
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
