import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { Upload, X, FileText, CheckCircle2, File, Plus } from 'lucide-react';
import { motion } from 'motion/react';

const PROJECT_CATEGORIES = [
  'Tecnología',
  'Medio Ambiente',
  'Salud',
  'Educación',
  'Finanzas',
  'Arte y Cultura',
  'Impacto Social',
  'Ciencia',
  'Deportes',
  'Entretenimiento'
];

export default function CreateProject() {
  const { currentUser, createProject } = useApp();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    categoria: 'Tecnología',
    startDate: '',
    endDate: '',
    funding: '',
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (newFiles.length > 0) {
        setImageFiles([...imageFiles, ...newFiles]);
        toast.success(`${newFiles.length} imagen(es) agregada(s)`);
      } else {
        toast.error('Por favor selecciona archivos de imagen válidos');
      }
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newFiles = Array.from(files).filter(f => f.type === 'application/pdf');
      if (newFiles.length > 0) {
        setPdfFiles([...pdfFiles, ...newFiles]);
        toast.success(`${newFiles.length} PDF(s) agregado(s)`);
      } else {
        toast.error('Por favor selecciona archivos PDF válidos');
      }
    }
    // Reset input
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const removeResource = (index: number) => {
    setPdfFiles(pdfFiles.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Nombre del proyecto es requerido';
    if (!formData.description) newErrors.description = 'Descripción es requerida';
    if (!formData.shortDescription) newErrors.shortDescription = 'Descripción corta es requerida';
    if (!formData.startDate) newErrors.startDate = 'Fecha de inicio es requerida';
    if (!formData.endDate) newErrors.endDate = 'Fecha de finalización es requerida';

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'La fecha de finalización debe ser posterior a la de inicio';
    } else if (formData.endDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (formData.endDate < todayStr) {
        newErrors.endDate = 'La fecha de finalización no puede ser anterior a la fecha actual';
      }
    }

    if (formData.funding && parseFloat(formData.funding) < 0) {
      newErrors.funding = 'El financiamiento no puede ser negativo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createProject({
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        categoria: formData.categoria,
        imageFiles: imageFiles,
        pdfFiles: pdfFiles,
        startDate: formData.startDate,
        endDate: formData.endDate,
        funding: formData.funding ? parseFloat(formData.funding) : undefined,
        createdByUserId: currentUser!.id,
        participatingUsers: [currentUser!.id]
      });

      setStep('success');
    } catch (err) {
      // AppContext.createProject ya muestra el toast con el motivo específico del error
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen">
        <Navbar />

        <div className="flex">
          <Sidebar />

          <main className="flex-1 p-8 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-success to-accent rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h1 className="text-3xl font-bold mb-4">¡Proyecto Creado!</h1>
                <p className="text-muted-foreground mb-8">
                  Tu proyecto ha sido publicado y ahora está visible para otras empresas.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/dashboard')}
                  >
                    Ir a Dashboard
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => navigate('/explore')}
                  >
                    Ver en Explorar
                  </Button>
                </div>
              </Card>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 py-10 px-6">

          {/* Page Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mb-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Crear Nuevo Proyecto</h1>
                <p className="text-muted-foreground text-sm">Publica tu proyecto para encontrar colaboradores</p>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

            {/* Section 1: Basic Info */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="overflow-hidden border-none shadow-md">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary/8 to-transparent border-b border-border">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-base">Información Básica</h2>
                </div>
                <div className="p-6 space-y-4">
                  <Input label="Nombre del Proyecto" name="name"
                    placeholder="Ej: Smart City Platform"
                    value={formData.name} onChange={handleChange} error={errors.name} />

                  <TextArea label="Descripción Corta" name="shortDescription"
                    placeholder="Resumen para tarjetas (máx. 120 caracteres)"
                    rows={2} value={formData.shortDescription}
                    onChange={handleChange} error={errors.shortDescription} />

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Categoría / Sector</label>
                    <select name="categoria" value={formData.categoria} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-input-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm">
                      {PROJECT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <TextArea label="Descripción Completa" name="description"
                    placeholder="Describe el proyecto en detalle: objetivos, alcance, tecnologías y requerimientos..."
                    rows={5} value={formData.description}
                    onChange={handleChange} error={errors.description} />
                </div>
              </Card>
            </motion.div>

            {/* Section 2: Dates & Funding */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="overflow-hidden border-none shadow-md">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-secondary/8 to-transparent border-b border-border">
                  <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                  </div>
                  <h2 className="font-bold text-base">Fechas y Financiamiento</h2>
                </div>
                <div className="p-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Input label="Fecha de Inicio" type="date" name="startDate"
                      value={formData.startDate} onChange={handleChange} error={errors.startDate} />
                    <Input label="Fecha de Finalización" type="date" name="endDate"
                      value={formData.endDate} onChange={handleChange} error={errors.endDate} />
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">Financiamiento <span className="text-muted-foreground font-normal">(opcional)</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
                        <input type="number" name="funding" placeholder="0.00" min="0"
                          value={formData.funding} onChange={handleChange}
                          className={`w-full pl-7 pr-4 py-2 bg-input-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm ${errors.funding ? 'border-destructive' : 'border-input'}`} />
                        {errors.funding && <p className="text-xs text-destructive mt-1">{errors.funding}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Section 3: Images */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="overflow-hidden border-none shadow-md">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-accent/8 to-transparent border-b border-border">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="font-bold text-base">Imágenes del Proyecto</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{imageFiles.length} añadida(s)</span>
                </div>
                <div className="p-6">
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {imageFiles.map((file, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-muted">
                          <img src={URL.createObjectURL(file)} alt={`img-${i}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeImage(i)}
                              className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-destructive transition-colors">
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white/80 truncate px-1">{file.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={imageInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/3 rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-all">
                    <Upload className="w-6 h-6" />
                    <span className="text-sm font-medium">Haz clic para añadir imágenes</span>
                    <span className="text-xs">PNG, JPG, WEBP hasta 10MB</span>
                  </button>
                </div>
              </Card>
            </motion.div>

            {/* Section 4: PDFs */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="overflow-hidden border-none shadow-md">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500/8 to-transparent border-b border-border">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <h2 className="font-bold text-base">Documentos PDF</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{pdfFiles.length} añadido(s)</span>
                </div>
                <div className="p-6">
                  {pdfFiles.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {pdfFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl">
                          <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <File className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={() => removeResource(i)}
                            className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={pdfInputRef} type="file" multiple accept="application/pdf" onChange={handlePdfSelect} className="hidden" />
                  <button type="button" onClick={() => pdfInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border hover:border-orange-400/60 hover:bg-orange-50/50 rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-orange-600 transition-all">
                    <FileText className="w-6 h-6" />
                    <span className="text-sm font-medium">Haz clic para añadir PDFs</span>
                    <span className="text-xs">Documentos de proyecto, especificaciones técnicas</span>
                  </button>
                </div>
              </Card>
            </motion.div>

            {/* Submit */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="flex gap-3 pb-10">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1 py-3">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1 py-3 shadow-lg shadow-primary/20" disabled={isSubmitting}>
                <Plus className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Publicando Proyecto...' : 'Publicar Proyecto'}
              </Button>
            </motion.div>
          </form>
        </main>
      </div>
    </div>
  );
}
