/* ============================================================================
 * src/pages/ForgotPassword.tsx
 * "Olvidé mi contraseña" con el diseño de las páginas de acceso: formulario a
 * la izquierda y, a la derecha, un correo con el código en camino que muestra
 * en vivo la dirección que se escribe.
 * ========================================================================= */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { LIMITES, CAMPOS, validarCampo } from '@/shared/validacion';
import { useSolicitarCodigoRecuperacion } from '@/features/auth';
import { AccesoLayout, EncabezadoAcceso } from '@/pages/acceso/AccesoLayout';
import { CorreoCodigo } from '@/pages/acceso/VistasAcceso';
import s from '@/pages/acceso/Acceso.module.css';

export default function ForgotPassword() {
  const [correo, setCorreo] = useState('');
  const navigate = useNavigate();
  const solicitarCodigo = useSolicitarCodigoRecuperacion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validarCampo(correo, CAMPOS.correo);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await solicitarCodigo.mutateAsync(correo.trim());
      toast.success('Si el correo está registrado, recibirás un código de verificación.');
      navigate(`/reset-password?correo=${encodeURIComponent(correo.trim())}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el código');
    }
  };

  const panel = (
    <div className={s.panel} aria-hidden="true">
      <CorreoCodigo correo={correo} />
    </div>
  );

  return (
    <AccesoLayout panel={panel}>
      <EncabezadoAcceso
        eyebrow="Recuperar contraseña"
        titulo="¿Olvidaste tu contraseña?"
        texto="Escribe tu correo y te enviaremos un código de verificación para crear una nueva."
        onVolver={() => navigate('/login')}
      />

      <form onSubmit={handleSubmit} className={`${s.campos} ${s.aparece}`} style={{ animationDelay: '.5s' }} noValidate>
        <div className={s.campo}>
          <label htmlFor="olvido-correo" className={s.etiqueta}>Correo</label>
          <input
            id="olvido-correo" type="email" autoComplete="email" placeholder="tu@empresa.com"
            className={s.input} value={correo} maxLength={LIMITES.usuario.correo}
            onChange={e => setCorreo(e.target.value)}
          />
        </div>

        <button type="submit" className={s.btn} disabled={solicitarCodigo.isPending}>
          {solicitarCodigo.isPending
            ? <><span className={s.girando} aria-hidden="true" /> Enviando…</>
            : <>Enviar código <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className={`${s.pie} ${s.aparece}`} style={{ animationDelay: '.7s' }}>
        ¿La recordaste? <Link to="/login" className={s.enlace}>Inicia sesión</Link>
      </p>
    </AccesoLayout>
  );
}
