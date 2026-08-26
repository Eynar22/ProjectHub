import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { AlertCircle, Clock, Info, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ title: string; message: string; type: 'pending' | 'rejected' | 'suspended' } | null>(null);

  // Estados para la animación del oso y responsividad
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const { login } = useApp();
  const navigate = useNavigate();

  // Rastrear el movimiento del mouse y el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      toast.success('¡Bienvenido de nuevo!');
      if (email === 'admin@platform.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      const msg = res.message?.toLowerCase() || '';
      if (msg.includes('denegada') || msg.includes('rechazado')) {
        setStatusMessage({ title: 'Solicitud Rechazada', message: res.message!, type: 'rejected' });
      } else if (msg.includes('aún no ha sido aprobada') || msg.includes('pendiente')) {
        setStatusMessage({ title: 'Solicitud en Revisión', message: res.message!, type: 'pending' });
      } else if (msg.includes('suspendido') || msg.includes('bloqueado')) {
        setStatusMessage({ title: 'Cuenta Suspendida', message: res.message!, type: 'suspended' });
      } else {
        setError(res.message || 'Credenciales inválidas o empresa no aprobada');
      }
    }
  };

  let lookX = 0;
  let lookY = 0;
  let mouthPath = "M 43 68 Q 50 72 57 68";

  if (isEmailFocused) {
    lookX = isMobile ? 0 : 6; 
    lookY = isMobile ? 6 : -2; 
  } else if (isPasswordFocused && showPassword) {
    lookX = isMobile ? 0 : 6;
    lookY = isMobile ? 6 : 3;
    mouthPath = "M 40 65 Q 50 78 60 65"; 
  } else if (isPasswordFocused && !showPassword) {
    lookX = 0;
    lookY = 0;
    mouthPath = "M 43 71 Q 50 66 57 71"; 
  } else {
    lookX = mousePos.x * 6;
    lookY = mousePos.y * 6;
  }

  const isCovering = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  const leftArmAnim = {
    y: isCovering ? -35 : (isPeeking ? -10 : 50),
    x: 0,
    rotate: 0
  };

  const rightArmAnim = {
    y: (isCovering || isPeeking) ? -35 : 50,
    x: 0,
    rotate: 0
  };

  if (statusMessage) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col bg-slate-50">
        <div className="absolute inset-0 z-0 pointer-events-none flex-grow">
          <div className="absolute top-[35%] -right-[20%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-300 via-purple-300 to-white opacity-80 filter blur-3xl"></div>
          <div className="absolute top-[10%] -left-[15%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-200 via-transparent to-transparent opacity-90 filter blur-3xl"></div>
        </div>
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-16 px-4 z-10 relative">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg mt-16">
            <Card className="p-10 pt-16 text-center border-none shadow-[0_8px_32px_0_rgba(100,100,100,0.1)] bg-white/60 backdrop-blur-3xl rounded-3xl relative">
               <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-slate-100/50 border border-slate-200 backdrop-blur-md">
                 {statusMessage.type === 'rejected' && <AlertCircle className="w-12 h-12 text-destructive" />}
                 {statusMessage.type === 'pending' && <Clock className="w-12 h-12 text-warning" />}
                 {statusMessage.type === 'suspended' && <Info className="w-12 h-12 text-orange-500" />}
               </div>
               <h2 className="text-4xl font-extrabold mb-5 text-slate-950 tracking-tight">{statusMessage.title}</h2>
               <p className="text-lg text-slate-800 mb-10 leading-relaxed font-medium">
                 {statusMessage.message}
               </p>
               <Button onClick={() => setStatusMessage(null)} variant="primary" className="w-full py-6 text-base font-extrabold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 border-none shadow-lg shadow-blue-500/10 text-white transition-all duration-300">
                 Volver al inicio de sesión
               </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-slate-50 overflow-hidden">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
        }
      `}</style>

      {/* NAVBAR */}
      <div className="absolute top-0 w-full z-50">
        <Navbar />
      </div>

      {/* ========================================================= */}
      {/* FONDO ANIMADO Y BORROSO MEJORADO (Movimiento más amplio)  */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Esfera 1: Morada (Superior izquierda) */}
        <motion.div
          animate={{ 
            x: [0, 150, -50, 0], 
            y: [0, -100, 120, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-purple-400/30 rounded-full blur-[120px] opacity-80"
        />
        
        {/* Esfera 2: Azul (Inferior derecha) */}
        <motion.div
          animate={{ 
            x: [0, -120, 80, 0], 
            y: [0, 100, -150, 0],
            scale: [0.9, 1.2, 1, 0.9]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-blue-400/30 rounded-full blur-[120px] opacity-70"
        />

        {/* Esfera 3: Fucsia suave (Central, cruza toda la pantalla) */}
        <motion.div
          animate={{ 
            x: [0, 100, -150, 0], 
            y: [0, -50, 100, 0],
            scale: [0.8, 1.2, 0.9, 0.8]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-fuchsia-400/20 rounded-full blur-[100px] opacity-60"
        />
      </div>

      {/* CONTENEDOR CENTRAL */}
      <div className="flex-grow flex items-center justify-center p-4 sm:p-8 z-10 relative mt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/50 min-h-[550px]"
        >
          
          {/* LADO IZQUIERDO: EL OSITO Y SU NUEVO MARCO PROFESIONAL */}
          <div className="lg:w-1/2 bg-slate-50/50 flex items-center justify-center relative p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
            
            <svg viewBox="0 0 100 100" className="w-72 h-72 xl:w-80 xl:h-80 relative z-10 overflow-visible mt-10">
              <defs>
                <linearGradient id="bearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" /> 
                  <stop offset="100%" stopColor="#a855f7" /> 
                </linearGradient>
                
                {/* DEGRADADO PARA EL MARCO EXTERIOR */}
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fa6560" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>

                {/* NUEVO: DEGRADADO RADIAL PARA EL FONDO (Efecto profundidad/cápsula) */}
                <radialGradient id="innerWindow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#c8c9ca" />
                </radialGradient>

                {/* SOMBRA DEL MARCO PARA DARLE PROFUNDIDAD */}
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#4c1d95" floodOpacity="0.25" />
                </filter>

                {/* CLIP-PATH: La máscara circular ajustada al interior del marco (r=42) */}
                <clipPath id="circleClip">
                  <circle cx="50" cy="55" r="45" />
                </clipPath>
              </defs>

              {/* ========================================================= */}
              {/* 1. MARCO GRUESO CON DEGRADADO Y SOMBRA                    */}
              {/* ========================================================= */}
              <circle cx="50" cy="55" r="47" fill="url(#ringGradient)" filter="url(#dropShadow)" />

              {/* ========================================================= */}
              {/* 2. VENTANA INTERIOR CON DEGRADADO RADIAL (Efecto túnel)   */}
              {/* ========================================================= */}
              <circle cx="50" cy="55" r="45" fill="url(#innerWindow)" />

              {/* ========================================================= */}
              {/* 3. SOMBRA INTERIOR SUTIL                                  */}
              {/* ========================================================= */}
              <circle cx="50" cy="55" r="45" fill="none" stroke="#0f172a" strokeOpacity="0.15" strokeWidth="1" />


              {/* Orejas y cabeza dibujadas DESPUÉS del círculo (Efecto 3D asomándose) */}
              <circle cx="20" cy="25" r="12" fill="url(#bearGradient)" />
              <circle cx="80" cy="25" r="12" fill="url(#bearGradient)" />
              <circle cx="50" cy="55" r="38" fill="url(#bearGradient)" />

              {/* Hocico y Nariz */}
              <ellipse cx="50" cy="65" rx="18" ry="14" className="fill-white" />
              <circle cx="50" cy="58" r="5" className="fill-slate-900" />

              {/* Boca Dinámica */}
              <motion.path
                d={mouthPath}
                stroke="currentColor"
                className="text-slate-900"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />

              {/* Ojos Blancos */}
              <circle cx="34" cy="40" r="8" fill="white" />
              <circle cx="66" cy="40" r="8" fill="white" />

              {/* Pupilas Movibles */}
              <motion.circle
                cx="34" cy="40" r="4" className="fill-slate-900"
                animate={{ x: lookX, y: lookY }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              />
              <motion.circle
                cx="66" cy="40" r="4" className="fill-slate-900"
                animate={{ x: lookX, y: lookY }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              />

              {/* GRUPO ENMASCARADO: Los brazos solo son visibles DENTRO de la ventana blanca (r=42) */}
              <g clipPath="url(#circleClip)">
                {/* Brazo Izquierdo */}
                <motion.g
                  initial={false}
                  animate={leftArmAnim}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  style={{ originX: "34px", originY: "100px" }}
                >
                  <ellipse cx="34" cy="100" rx="11" ry="35" fill="url(#bearGradient)" className="drop-shadow-md" />
                  <ellipse cx="34" cy="100" rx="11" ry="35" className="fill-black/10" />
                  <ellipse cx="29" cy="69" rx="1.5" ry="4" className="fill-slate-900 opacity-60" />
                  <ellipse cx="34" cy="67" rx="1.5" ry="4" className="fill-slate-900 opacity-60" />
                  <ellipse cx="39" cy="69" rx="1.5" ry="4" className="fill-slate-900 opacity-60" />
                </motion.g>

                {/* Brazo Derecho */}
                <motion.g
                  initial={false}
                  animate={rightArmAnim}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  style={{ originX: "66px", originY: "100px" }}
                >
                  <ellipse cx="66" cy="100" rx="11" ry="35" fill="url(#bearGradient)" className="drop-shadow-md" />
                  <ellipse cx="66" cy="100" rx="11" ry="35" className="fill-black/10" />
                  <ellipse cx="61" cy="69" rx="1.5" ry="4" className="fill-slate-900 opacity-60" />
                  <ellipse cx="66" cy="67" rx="1.5" ry="4" className="fill-slate-900 opacity-60" />
                  <ellipse cx="71" cy="69" rx="1.5" ry="4" className="fill-slate-900 opacity-60" />
                </motion.g>
              </g>
            </svg>
          </div>

          {/* LADO DERECHO: FORMULARIO */}
          <div className="lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-20 bg-white relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold mb-2 text-slate-950 tracking-wide">¡Hola de nuevo!</h1>
              <p className="text-slate-500 font-medium text-sm">
                Por favor, ingresa tus datos para continuar
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div
                className="flex flex-col gap-1.5"
                onFocusCapture={() => { setIsEmailFocused(true); setIsPasswordFocused(false); }}
                onBlurCapture={() => setIsEmailFocused(false)}
              >
                <label className="text-sm font-semibold text-slate-900 ml-1">Email</label>
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-900 px-5 py-4 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all font-medium"
                />
              </div>

              <div
                className="flex flex-col gap-1.5"
                onFocusCapture={() => { setIsPasswordFocused(true); setIsEmailFocused(false); }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsPasswordFocused(false);
                  }
                }}
              >
                <label className="text-sm font-semibold text-slate-900 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-900 placeholder:text-slate-400 px-5 py-4 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all pr-14 font-medium tracking-wide"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-purple-600 transition-colors focus:outline-none bg-white rounded-full shadow-sm border border-slate-100"
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-xs font-medium text-slate-500">Recordarme 30 días</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" variant="primary" className="w-full py-4 text-base font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white transition-all duration-300 mt-6 disabled:opacity-70 disabled:cursor-not-allowed" disabled={isLoading}>
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600 font-medium">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
}