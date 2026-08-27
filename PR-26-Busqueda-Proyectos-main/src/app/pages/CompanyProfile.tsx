import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useEmpresa, useActualizarEmpresa } from '@/features/empresas';
import { useCambiarPassword } from '@/features/auth';
import { useSubirArchivo } from '@/features/workspace';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { toast } from 'sonner';
import {
  Building2, User, FileText, Eye, Download,
  Mail, Briefcase, Shield, Crown, Users,
  CheckCircle2, Clock, AlertCircle, Calendar,
  Pencil, X, Camera, Plus, Trash2, Link2, Loader2, Upload, Lock,
} from 'lucide-react';
import { motion } from 'motion/react';

function InfoRow({ icon: Icon, label, value, color = 'text-muted-foreground' }: {
  icon: any; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const { currentUser, openBase64, updateProfile } = useApp();
  const subir = useSubirArchivo();
  const uploadFile = async (file: File) => (await subir.mutateAsync(file)).base64;
  // El detalle de empresa (documento_url, imagenes, enlaces) lo trae este hook;
  // el listado ligero no. Se re-descarga solo tras cada actualización.
  const { data: userCompany } = useEmpresa(currentUser?.empresa_id);
  const actualizarEmpresa = useActualizarEmpresa();
  const cambiarPassword = useCambiarPassword();

  const isCompanyAdmin = currentUser?.rol === 'admin' && !!userCompany;

  const rolConfig = {
    superadmin: { label: 'Administrador del Sistema', icon: Shield, color: 'text-primary', bg: 'bg-muted' },
    admin:      { label: 'Administrador de Empresa',  icon: Crown,  color: 'text-info-strong',   bg: 'bg-info-subtle'   },
    empleado:   { label: 'Empleado',                  icon: Users,  color: 'text-muted-foreground',  bg: 'bg-muted'  },
  };
  const rol = rolConfig[currentUser?.rol || 'empleado'];
  const RolIcon = rol.icon;

  const estadoCompany = {
    aprobado: { label: 'Empresa Aprobada', icon: CheckCircle2, color: 'text-success-strong', bg: 'bg-success-subtle', border: 'border-success/30' },
    pendiente: { label: 'Pendiente de Aprobación', icon: Clock,        color: 'text-warning-strong',  bg: 'bg-warning-subtle',  border: 'border-warning/30'  },
    bloqueado: { label: 'Empresa Bloqueada',       icon: AlertCircle, color: 'text-danger-strong',    bg: 'bg-danger-subtle',    border: 'border-danger/30'    },
    rechazado: { label: 'Empresa Rechazada',       icon: AlertCircle, color: 'text-danger-strong',    bg: 'bg-danger-subtle',    border: 'border-danger/30'    },
  };
  const companyEstado = estadoCompany[userCompany?.estado || 'pendiente'];
  const EstadoIcon = companyEstado.icon;

  const initials = currentUser?.nombre_completo
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  // ───────────────────────── Perfil personal (cualquier usuario) ─────────────────────────
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ nombre_completo: '', cargo: '' });
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const startEditingProfile = () => {
    setProfileForm({ nombre_completo: currentUser?.nombre_completo || '', cargo: currentUser?.cargo || '' });
    setPhotoPreview(currentUser?.foto_url);
    setEditingProfile(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecciona un archivo de imagen válido'); return; }
    setUploadingPhoto(true);
    try {
      setPhotoPreview(await uploadFile(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.nombre_completo.trim()) { toast.error('El nombre no puede estar vacío'); return; }
    setSavingProfile(true);
    try {
      await updateProfile({
        nombre_completo: profileForm.nombre_completo.trim(),
        cargo: profileForm.cargo.trim(),
        foto_url: photoPreview,
      });
      setEditingProfile(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  // ───────────────────────── Cambio de contraseña (cualquier usuario) ─────────────────────────
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const startEditingPassword = () => {
    setPasswordForm({ actual: '', nueva: '', confirmar: '' });
    setEditingPassword(true);
  };

  const handleSavePassword = async () => {
    if (!passwordForm.actual || !passwordForm.nueva) { toast.error('Completa todos los campos'); return; }
    if (passwordForm.nueva.length < 4) { toast.error('La nueva contraseña debe tener al menos 4 caracteres'); return; }
    if (passwordForm.nueva !== passwordForm.confirmar) { toast.error('Las contraseñas no coinciden'); return; }

    setSavingPassword(true);
    try {
      await cambiarPassword.mutateAsync({
        password_actual: passwordForm.actual,
        password_nueva: passwordForm.nueva,
      });
      toast.success('Contraseña actualizada correctamente');
      setEditingPassword(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  // ───────────────────────── Perfil de empresa (solo su admin) ─────────────────────────
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ descripcion: '', num_empleados: '', portafolio: '' });
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [docPreview, setDocPreview] = useState<string | undefined>(undefined);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [links, setLinks] = useState<{ url: string; nombre?: string }[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkNombre, setNewLinkNombre] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const startEditingCompany = () => {
    if (!userCompany) return;
    setCompanyForm({
      descripcion: userCompany.descripcion || '',
      num_empleados: userCompany.num_empleados?.toString() || '',
      portafolio: userCompany.portafolio || '',
    });
    setLogoPreview(userCompany.logo_url);
    setDocPreview(userCompany.documento_url);
    setGalleryUrls((userCompany.imagenes || []).map(i => i.url));
    setLinks((userCompany.enlaces || []).map(e => ({ url: e.url, nombre: e.nombre })));
    setEditingCompany(true);
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecciona un archivo de imagen válido'); return; }
    setUploadingLogo(true);
    try {
      setLogoPreview(await uploadFile(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      setDocPreview(await uploadFile(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el documento');
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { toast.error('Selecciona archivos de imagen válidos'); return; }
    setUploadingGallery(true);
    try {
      const uploaded = await Promise.all(imageFiles.map(f => uploadFile(f)));
      setGalleryUrls(prev => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir las imágenes');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (index: number) => setGalleryUrls(prev => prev.filter((_, i) => i !== index));

  const addLink = () => {
    if (!newLinkUrl.trim()) { toast.error('Ingresa una URL'); return; }
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setLinks(prev => [...prev, { url, nombre: newLinkNombre.trim() || undefined }]);
    setNewLinkUrl('');
    setNewLinkNombre('');
  };

  const removeLink = (index: number) => setLinks(prev => prev.filter((_, i) => i !== index));

  const handleSaveCompany = async () => {
    if (!userCompany) return;
    setSavingCompany(true);
    try {
      await actualizarEmpresa.mutateAsync({
        id: userCompany.id,
        datos: {
          descripcion: companyForm.descripcion.trim(),
          num_empleados: companyForm.num_empleados ? parseInt(companyForm.num_empleados, 10) : undefined,
          portafolio: companyForm.portafolio.trim(),
          documento_url: docPreview,
          logo_url: logoPreview,
          imagenes_urls: galleryUrls,
          enlaces: links,
        },
      });
      setEditingCompany(false);
    } catch {
      /* el toast de error lo muestra el hook */
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 py-10 px-6">

          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mi Perfil</h1>
              <p className="text-muted-foreground text-sm">Tu información personal y datos de empresa</p>
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-6">

            {/* LEFT: User card */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="lg:col-span-1 space-y-4">

              {/* Avatar + Name */}
              <Card className="p-6 border-none shadow-md text-center overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-primary/20 to-secondary/20" />
                <div className="relative pt-4">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    {(editingProfile ? photoPreview : currentUser?.foto_url) ? (
                      <img
                        src={editingProfile ? photoPreview : currentUser?.foto_url}
                        alt={currentUser?.nombre_completo}
                        className="w-20 h-20 rounded-2xl object-cover shadow-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-xl">
                        {initials}
                      </div>
                    )}
                    {editingProfile && (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                        title="Cambiar foto"
                      >
                        {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      </button>
                    )}
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </div>

                  {editingProfile ? (
                    <Input
                      value={profileForm.nombre_completo}
                      onChange={(e) => setProfileForm(f => ({ ...f, nombre_completo: e.target.value }))}
                      className="text-center font-bold"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{currentUser?.nombre_completo}</h2>
                  )}
                  <p className="text-muted-foreground text-sm mt-0.5">{currentUser?.correo}</p>

                  {/* Rol badge */}
                  <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-bold ${rol.bg} ${rol.color}`}>
                    <RolIcon className="w-3.5 h-3.5" />
                    {rol.label}
                  </div>
                </div>

                {/* Company status badge */}
                {userCompany && (
                  <div className={`mt-4 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${companyEstado.bg} ${companyEstado.color} ${companyEstado.border}`}>
                    <EstadoIcon className="w-3.5 h-3.5" />
                    {companyEstado.label}
                  </div>
                )}
              </Card>

              {/* Personal Document */}
              {currentUser?.documento_url && (
                <Card className="p-5 border-none shadow-md">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Documento Personal</h3>
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">Documento de Identidad</p>
                      <p className="text-xs text-muted-foreground">PDF adjunto</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openBase64(currentUser.documento_url!)}
                        className="w-8 h-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a href={currentUser.documento_url} download="documento.pdf"
                        className="w-8 h-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
                        title="Descargar">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>

            {/* RIGHT: Details */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4">

              {/* Personal Info */}
              <Card className="border-none shadow-md overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold">Datos Personales</h2>
                  {!editingProfile ? (
                    <button
                      type="button"
                      onClick={startEditingProfile}
                      className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  ) : (
                    <div className="ml-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        disabled={savingProfile}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                      <Button type="button" size="sm" onClick={handleSaveProfile} disabled={savingProfile || uploadingPhoto}>
                        {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
                      </Button>
                    </div>
                  )}
                </div>
                {editingProfile ? (
                  <div className="p-4 grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Cargo"
                      placeholder="Ej. Desarrollador"
                      value={profileForm.cargo}
                      onChange={(e) => setProfileForm(f => ({ ...f, cargo: e.target.value }))}
                    />
                    <div>
                      <label className="block mb-2 text-sm text-foreground">Correo Electrónico</label>
                      <p className="px-4 py-2 text-sm text-muted-foreground bg-muted rounded-lg">{currentUser?.correo}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 grid sm:grid-cols-2 gap-1">
                    <InfoRow icon={User}     label="Nombre Completo" value={currentUser?.nombre_completo || ''} />
                    <InfoRow icon={Mail}     label="Correo Electrónico" value={currentUser?.correo || ''} />
                    <InfoRow icon={Briefcase} label="Cargo"          value={currentUser?.cargo || 'No especificado'} />
                    <InfoRow icon={RolIcon}  label="Rol en Plataforma" value={rol.label} color={rol.color} />
                  </div>
                )}
              </Card>

              {/* Security / Change Password */}
              <Card className="border-none shadow-md overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold">Seguridad</h2>
                  {!editingPassword ? (
                    <button
                      type="button"
                      onClick={startEditingPassword}
                      className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Cambiar Contraseña
                    </button>
                  ) : (
                    <div className="ml-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingPassword(false)}
                        disabled={savingPassword}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                      <Button type="button" size="sm" onClick={handleSavePassword} disabled={savingPassword}>
                        {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
                      </Button>
                    </div>
                  )}
                </div>
                {editingPassword ? (
                  <div className="p-4 grid sm:grid-cols-3 gap-4">
                    <Input
                      label="Contraseña actual"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.actual}
                      onChange={(e) => setPasswordForm(f => ({ ...f, actual: e.target.value }))}
                    />
                    <Input
                      label="Nueva contraseña"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.nueva}
                      onChange={(e) => setPasswordForm(f => ({ ...f, nueva: e.target.value }))}
                    />
                    <Input
                      label="Confirmar nueva contraseña"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.confirmar}
                      onChange={(e) => setPasswordForm(f => ({ ...f, confirmar: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">Actualiza periódicamente tu contraseña para mantener tu cuenta segura.</p>
                  </div>
                )}
              </Card>

              {/* Company Info */}
              {userCompany && (
                <Card className="border-none shadow-md overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/5 to-transparent">
                    {userCompany.logo_url ? (
                      <img src={userCompany.logo_url} alt={userCompany.nombre} className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-secondary" />
                      </div>
                    )}
                    <h2 className="font-bold">Datos de la Empresa</h2>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${companyEstado.bg} ${companyEstado.color} ${companyEstado.border}`}>
                      {userCompany.estado?.toUpperCase()}
                    </span>
                    {isCompanyAdmin && !editingCompany && (
                      <button
                        type="button"
                        onClick={startEditingCompany}
                        className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                    {isCompanyAdmin && editingCompany && (
                      <div className="ml-auto flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingCompany(false)}
                          disabled={savingCompany}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          Cancelar
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveCompany}
                          disabled={savingCompany || uploadingLogo || uploadingDoc || uploadingGallery}
                        >
                          {savingCompany ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {editingCompany ? (
                    <div className="p-6 space-y-5">
                      {/* Logo */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary text-primary-foreground flex items-center justify-center shadow hover:opacity-90 transition-opacity disabled:opacity-60"
                          >
                            {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                          </button>
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Logo de la empresa</p>
                          <p className="text-xs text-muted-foreground">Se muestra en el buscador y tu perfil</p>
                        </div>
                      </div>

                      <Input
                        label="Número de Empleados"
                        type="number"
                        min={0}
                        value={companyForm.num_empleados}
                        onChange={(e) => setCompanyForm(f => ({ ...f, num_empleados: e.target.value }))}
                      />

                      <TextArea
                        label="Descripción"
                        rows={3}
                        value={companyForm.descripcion}
                        onChange={(e) => setCompanyForm(f => ({ ...f, descripcion: e.target.value }))}
                      />

                      <TextArea
                        label="Portafolio / Experiencia"
                        rows={3}
                        value={companyForm.portafolio}
                        onChange={(e) => setCompanyForm(f => ({ ...f, portafolio: e.target.value }))}
                      />

                      {/* Document */}
                      <div>
                        <label className="block mb-2 text-sm text-foreground">Documento de Empresa (NIT / Matrícula)</label>
                        <div className="flex items-center gap-3">
                          <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}>
                            {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-4 h-4 mr-1.5" />}
                            {docPreview ? 'Reemplazar documento' : 'Subir documento'}
                          </Button>
                          {docPreview && (
                            <button type="button" onClick={() => openBase64(docPreview!)} className="text-xs text-primary hover:underline">
                              Ver actual
                            </button>
                          )}
                        </div>
                        <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleDocSelect} />
                      </div>

                      {/* Gallery */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm text-foreground">Fotos de la Empresa</label>
                          <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
                            {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                            Agregar
                          </Button>
                          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallerySelect} />
                        </div>
                        {galleryUrls.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {galleryUrls.map((url, i) => (
                              <div key={i} className="relative group aspect-square">
                                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-border" />
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(i)}
                                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Aún no has agregado fotos.</p>
                        )}
                      </div>

                      {/* Links */}
                      <div>
                        <label className="block mb-2 text-sm text-foreground">Enlaces</label>
                        {links.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {links.map((link, i) => (
                              <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{link.nombre || link.url}</p>
                                  {link.nombre && <p className="text-xs text-muted-foreground truncate">{link.url}</p>}
                                </div>
                                <button type="button" onClick={() => removeLink(i)} className="p-1 hover:bg-muted rounded-full flex-shrink-0">
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            placeholder="Nombre (opcional, ej. Sitio web)"
                            value={newLinkNombre}
                            onChange={(e) => setNewLinkNombre(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            placeholder="https://..."
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addLink}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 grid sm:grid-cols-2 gap-1">
                        <InfoRow icon={Building2} label="Nombre de Empresa" value={userCompany.nombre} />
                        <InfoRow icon={Users}     label="Número de Empleados" value={userCompany.num_empleados?.toString() || '—'} />
                        <InfoRow icon={Calendar}  label="Fecha de Registro"
                          value={userCompany.fecha_registro ? new Date(userCompany.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
                        <InfoRow icon={CheckCircle2} label="Fecha de Aprobación"
                          value={userCompany.fecha_aprobacion ? new Date(userCompany.fecha_aprobacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Pendiente'} />
                      </div>

                      {userCompany.descripcion && (
                        <div className="px-6 pb-4">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Descripción</p>
                          <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl p-4">{userCompany.descripcion}</p>
                        </div>
                      )}

                      {userCompany.portafolio && (
                        <div className="px-6 pb-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Portafolio / Experiencia</p>
                          <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl p-4 italic">"{userCompany.portafolio}"</p>
                        </div>
                      )}

                      {userCompany?.imagenes && userCompany?.imagenes.length > 0 && (
                        <div className="px-6 pb-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Fotos de la Empresa</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {userCompany?.imagenes.map(img => (
                              <img key={img.id} src={img.url} alt="" className="w-full aspect-square object-cover rounded-lg border border-border" />
                            ))}
                          </div>
                        </div>
                      )}

                      {userCompany?.enlaces && userCompany?.enlaces.length > 0 && (
                        <div className="px-6 pb-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Enlaces</p>
                          <div className="flex flex-wrap gap-2">
                            {userCompany?.enlaces.map(link => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-full text-xs font-medium text-primary transition-colors"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                {link.nombre || link.url}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Company document */}
                      {userCompany?.documento_url && (
                        <div className="px-6 pb-5 border-t border-border pt-4">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Documento de Empresa</p>
                          <div className="flex items-center gap-3 p-3 bg-secondary/5 border border-secondary/20 rounded-xl">
                            <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">Acreditación Empresarial</p>
                              <p className="text-xs text-muted-foreground">NIT / Matrícula de Comercio</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openBase64(userCompany?.documento_url!)}
                                className="w-8 h-8 rounded-lg hover:bg-secondary/10 flex items-center justify-center text-secondary transition-colors"
                                title="Ver"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a href={userCompany?.documento_url} download="documento-empresa.pdf"
                                className="w-8 h-8 rounded-lg hover:bg-secondary/10 flex items-center justify-center text-secondary transition-colors"
                                title="Descargar">
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )}

              {/* No company */}
              {!userCompany && (
                <Card className="border-none shadow-md p-8 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No estás asociado a ninguna empresa</p>
                </Card>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
