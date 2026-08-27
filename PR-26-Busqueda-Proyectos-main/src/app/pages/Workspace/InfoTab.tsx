import { RefObject } from 'react';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Calendar, DollarSign, Users, Image, Upload, Loader2, X, Pencil } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import type { Project } from '../../context/AppContext';

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
  editDescripcion,
  setEditDescripcion,
  editFechaFin,
  setEditFechaFin,
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
  editDescripcion: string;
  setEditDescripcion: (v: string) => void;
  editFechaFin: string;
  setEditFechaFin: (v: string) => void;
  editImagenes: string[];
  removeEditImage: (index: number) => void;
  uploadingProjectImage: boolean;
  projectImageInputRef: RefObject<HTMLInputElement>;
  handleProjectImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  participantsCount: number;
}) {
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
        <h3 className="text-xl font-semibold mb-4">Descripción</h3>
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
            <Users className="w-5 h-5 text-accent" />
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
