/* ============================================================================
 * src/features/auth/components/LoginForm.tsx
 * Inicio de sesión con el estilo de la portada (AccesoLayout). La lógica no
 * cambió: valida, llama a login(), muestra la pantalla de estado si la cuenta
 * está pendiente / rechazada / suspendida y redirige según el rol.
 * ========================================================================= */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AlertCircle, ArrowRight, Clock, Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { LIMITES } from '@/shared/validacion';
import { useApp } from '@/app/context/AppContext';
import { esIndependiente } from '@/shared/utils/roles';
import { AccesoLayout, TituloAnimado } from '@/pages/acceso/AccesoLayout';
import s from '@/pages/acceso/Acceso.module.css';
import { EspacioPrevio } from '@/pages/acceso/VistasAcceso';

type Estado = { title: string; message: string; type: 'pending' | 'rejected' | 'suspended' };

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<Estado | null>(null);
  const [enClave, setEnClave] = useState(false);
  const [verClave, setVerClave] = useState(false);

  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
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
      if (res.user?.rol === 'superadmin') navigate('/admin');
      else if (esIndependiente(res.user)) navigate('/explore'); // su inicio es Explorar
      else navigate('/dashboard');
    } else {
      const msg = res.message?.toLowerCase() || '';
      if (msg.includes('denegada') || msg.includes('rechazado')) {
        setStatusMessage({ title: 'Solicitud rechazada', message: res.message!, type: 'rejected' });
      } else if (msg.includes('aún no ha sido aprobada') || msg.includes('pendiente')) {
        setStatusMessage({ title: 'Solicitud en revisión', message: res.message!, type: 'pending' });
      } else if (msg.includes('suspendido') || msg.includes('bloqueado')) {
        setStatusMessage({ title: 'Cuenta suspendida', message: res.message!, type: 'suspended' });
      } else {
        setError(res.message || 'Credenciales inválidas o empresa no aprobada');
      }
    }
  };

  // Pantalla de estado de la cuenta
  if (statusMessage) {
    const color = statusMessage.type === 'rejected' ? 'var(--rojo)' : 'var(--ambar)';
    const Icono = statusMessage.type === 'rejected' ? AlertCircle : statusMessage.type === 'pending' ? Clock : Info;
    return (
      <AccesoLayout>
        <div className={s.estado}>
          <div className={`${s.estadoIcono} ${s.aparece}`} style={{ background: color }}><Icono size={38} /></div>
          <TituloAnimado texto={statusMessage.title} retraso={0.1} />
          <p className={s.sub}>{statusMessage.message}</p>
          <button type="button" className={`${s.btn} ${s.aparece}`} style={{ animationDelay: '.5s', maxWidth: 360 }} onClick={() => setStatusMessage(null)}>
            Volver al inicio de sesión
          </button>
        </div>
      </AccesoLayout>
    );
  }

  const panel = (
    <div className={s.panel} aria-hidden="true">
      <EspacioPrevio correo={email} privado={enClave && !verClave} />
    </div>
  );

  return (
    <AccesoLayout panel={panel}>
      <p className={`${s.eyebrow} ${s.aparece}`}>Iniciar sesión</p>
      <TituloAnimado texto="Hola de nuevo." retraso={0.1} />
      <p className={s.sub}>Ingresa tus datos para continuar con tus proyectos.</p>

      {error && (
        <div className={s.error} role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${s.campos} ${s.aparece}`} style={{ animationDelay: '.5s' }} noValidate>
        <div className={s.campo}>
          <label htmlFor="login-email" className={s.etiqueta}>Correo</label>
          <input
            id="login-email" type="email" autoComplete="email" placeholder="tu@empresa.com"
            className={s.input} value={email} maxLength={LIMITES.usuario.correo}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setEnClave(false)}
          />
        </div>

        <div
          className={s.campo}
          onFocusCapture={() => setEnClave(true)}
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setEnClave(false); }}
        >
          <label htmlFor="login-password" className={s.etiqueta}>Contraseña</label>
          <div className={s.conIcono}>
            <input
              id="login-password" type={verClave ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
              className={s.input} value={password} maxLength={LIMITES.usuario.password_max}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" className={s.ojo} onClick={() => setVerClave(v => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}>
              {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className={s.fila}>
          <label><input type="checkbox" /> Recordarme 30 días</label>
          <Link to="/forgot-password" className={s.enlace}>¿Olvidaste tu contraseña?</Link>
        </div>

        <button type="submit" className={s.btn} disabled={isLoading}>
          {isLoading ? <><span className={s.girando} aria-hidden="true" /> Iniciando sesión…</> : <>Iniciar sesión <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className={`${s.pie} ${s.aparece}`} style={{ animationDelay: '.7s' }}>
        ¿No tienes cuenta? <Link to="/register" className={s.enlace}>Regístrate aquí</Link>
      </p>
    </AccesoLayout>
  );
}
