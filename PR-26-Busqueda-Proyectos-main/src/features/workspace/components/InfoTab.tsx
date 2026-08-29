import { RefObject } from 'react';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Calendar, DollarSign, Users, Image, Upload, Loader2, X, Pencil, AlertOctagon, Target } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { ODS_LIST, ODS_POR_ID } from '@/shared/constants/ods';
import type { Project } from '@/features/proyectos';

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

export function InfoTab({
  project,
  puedeEditarInfo,
  editingProjectInfo,
  setEditingProjectInfo,
  startEditingProjectInfo,
  savingProjectInfo,
  handleSaveProjectInfo,
  editNombre,
  setEditNombre,
  editDescCorta,
  setEditDescCorta,
  editDescripcion,
  setEditDescripcion,
  editProblema,
  setEditProblema,
  editFechaFin,
  setEditFechaFin,
  editOds,
  toggleEditOds,
  editImagenes,
  removeEditImage,
  uploadingProjectImage,
  projectImageInputRef,
  handleProjectImageSelect,
  participantsCount,
}: {
  project: Project;
  puedeEditarInfo: boolean;
  editingProjectInfo: boolean;
  setEditingProjectInfo: (v: boolean) => void;
  startEditingProjectInfo: () => void;
  savingProjectInfo: boolean;
  handleSaveProjectInfo: () => void;
  editNombre: string;
  setEditNombre: (v: string) => void;
  editDescCorta: string;
  setEditDescCorta: (v: string) => void;
  editDescripcion: string;
  setEditDescripcion: (v: string) => void;
  editProblema: string;
  setEditProblema: (v: string) => void;
  editFechaFin: string;
  setEditFechaFin: (v: string) => void;
  editOds: number[];
  toggleEditOds: (id: number) => void;
  editImagenes: string[];
  removeEditImage: (index: number) => void;
  uploadingProjectImage: boolean;
  projectImageInputRef: RefObject<HTMLInputElement>;
  handleProjectImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  participantsCount: number;
}) {
  const odsDelProyecto = Array.isArray(project.ods) ? project.ods : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Edit toggle (Administrador de Empresa) */}
      {puedeEditarInfo && (
        <div className="flex justify-end -mb-2">
          {!editingProjectInfo ? (
            <Button
              variant="outline"
              size="sm"
              onClick={startEditingProjectInfo}
              className="flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar Información
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingProjectInfo(false)} disabled={savingProjectInfo}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveProjectInfo} disabled={savingProjectInfo} className="flex items-center gap-2">
                {savingProjectInfo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Datos generales — solo visible en edición (nombre + descripción corta) */}
      {editingProjectInfo && (
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Datos generales</h3>
          <Input
            label="Nombre del proyecto"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            placeholder="Nombre del proyecto"
          />
          <TextArea
            label="Descripción corta"
            value={editDescCorta}
            onChange={(e) => setEditDescCorta(e.target.value)}
            placeholder="Resumen para las tarjetas (máx. ~120 caracteres)"
            rows={2}
          />
        </Card>
      )}

      {/* Images */}
      <Card className="overflow-hidden">
        {editingProjectInfo ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" /> Imágenes del Proyecto
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => projectImageInputRef.current?.click()}
                disabled={uploadingProjectImage}
                className="flex items-center gap-2"
              >
                {uploadingProjectImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Agregar
              </Button>
              <input
                ref={projectImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleProjectImageSelect}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {editImagenes.map((url, idx) => (
                <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                  <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeEditImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {editImagenes.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">Sin imágenes. Agrega al menos una.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-96">
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
          </div>
        )}
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h3 className="text-xl font-bold tracking-tight mb-4">Descripción</h3>
        {editingProjectInfo ? (
          <TextArea
            value={editDescripcion}
            onChange={(e) => setEditDescripcion(e.target.value)}
            placeholder="Descripción completa del proyecto..."
            rows={6}
          />
        ) : (
          <p className="text-muted-foreground whitespace-pre-line">
            {project.descripcion_completa}
          </p>
        )}
      </Card>

      {/* Problema que resuelve */}
      <Card className="p-6">
        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-warning-strong" /> El problema que resuelve
        </h3>
        {editingProjectInfo ? (
          <TextArea
            value={editProblema}
            onChange={(e) => setEditProblema(e.target.value)}
            placeholder="¿Qué problema concreto aborda este proyecto?"
            rows={3}
          />
        ) : (
          <p className="text-muted-foreground whitespace-pre-line">
            {project.problema || 'No especificado.'}
          </p>
        )}
      </Card>

      {/* ODS */}
      <Card className="p-6">
        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Objetivos de Desarrollo Sostenible
        </h3>
        {editingProjectInfo ? (
          <div className="flex flex-wrap gap-2">
            {ODS_LIST.map((o) => {
              const activo = editOds.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleEditOds(o.id)}
                  aria-pressed={activo}
                  title={o.nombre}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activo ? 'text-white border-transparent shadow-sm' : 'bg-input-background text-foreground border-input hover:border-primary/40'
                  }`}
                  style={activo ? { backgroundColor: o.color } : undefined}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${activo ? 'bg-white/25' : 'bg-muted'}`}>
                    {o.id}
                  </span>
                  <span className="max-w-[10rem] truncate">{o.nombre}</span>
                </button>
              );
            })}
          </div>
        ) : odsDelProyecto.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {odsDelProyecto.map((id) => {
              const o = ODS_POR_ID[id];
              if (!o) return null;
              return (
                <span
                  key={id}
                  title={o.nombre}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: o.color }}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">{o.id}</span>
                  {o.nombre}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">Este proyecto no declaró ningún ODS.</p>
        )}
      </Card>

      {/* Info Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Fechas</h4>
          </div>
          <div className="text-sm text-muted-foreground space-y-1.5">
            <div>Inicio: {project.fecha_inicio}</div>
            {editingProjectInfo ? (
              <div className="flex items-center gap-2">
                <span>Fin:</span>
                <Input
                  type="date"
                  value={editFechaFin}
                  onChange={(e) => setEditFechaFin(e.target.value)}
                  className="h-8 text-sm w-40"
                />
              </div>
            ) : (
              <div>Fin: {project.fecha_fin}</div>
            )}
          </div>
        </Card>

        {project.financiamiento && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-success" />
              <h4 className="font-semibold">Financiamiento</h4>
            </div>
            <div className="text-2xl font-bold text-success">
              ${project.financiamiento.toLocaleString()}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Colaboradores</h4>
          </div>
          <div className="text-2xl font-bold">
            {participantsCount}
          </div>
        </Card>
      </div>

      {/* End of Info Section */}
    </motion.div>
  );
}
