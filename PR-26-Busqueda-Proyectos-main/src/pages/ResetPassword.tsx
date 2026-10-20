/* ============================================================================
 * src/pages/ResetPassword.tsx
 * Restablecer contraseña con el diseño de las páginas de acceso. A la derecha,
 * las cajas del código se llenan mientras se escribe y el candado se abre
 * cuando el código y la nueva contraseña están completos.
 * ========================================================================= */

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { LIMITES, CAMPOS, validarCampos, validarConfirmacion, primerError } from '@/shared/validacion';
import { useRestablecerPassword } from '@/features/auth';
import { AccesoLayout, EncabezadoAcceso } from '@/pages/acceso/AccesoLayout';
import { Desbloqueo } from '@/pages/acceso/VistasAcceso';
import s from '@/pages/acceso/Acceso.module.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [correo, setCorreo] = useState(searchParams.get('correo') || '');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const navigate = useNavigate();
  const restablecer = useRestablecerPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error =
      primerError(validarCampos({ correo, codigo, nuevaPassword }, {
        correo: CAMPOS.correo,
        codigo: CAMPOS.codigo,
        nuevaPassword: { ...CAMPOS.password, etiqueta: 'La nueva contraseña' },
      })) ?? validarConfirmacion(nuevaPassword, confirmarPassword);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await restablecer.mutateAsync({
        correo: correo.trim(),
        codigo: codigo.trim(),
        nueva_password: nuevaPassword,
      });
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña');
    }
  };

  // El candado se abre cuando el formulario ya pasaría la validación.
  const listo = codigo.length === 6
    && !primerError(validarCampos({ correo, nuevaPassword }, { correo: CAMPOS.correo, nuevaPassword: CAMPOS.password }))
    && nuevaPassword === confirmarPassword;

  const panel = (
    <div className={s.panel} aria-hidden="true">
      <Desbloqueo codigo={codigo} listo={listo} />
    </div>
  );

  const ojo = (
    <button type="button" className={s.ojo} onClick={() => setVerClave(v => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}>
      {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  return (
    <AccesoLayout panel={panel}>
      <EncabezadoAcceso
        eyebrow="Restablecer contraseña"
        titulo="Crea tu nueva contraseña."
        texto="Ingresa el código de 6 dígitos que enviamos a tu correo y elige una contraseña nueva."
        onVolver={() => navigate('/forgot-password')}
      />

      <form onSubmit={handleSubmit} className={`${s.campos} ${s.aparece}`} style={{ animationDelay: '.5s' }} noValidate>
        <div className={s.campo}>
          <label htmlFor="reset-correo" className={s.etiqueta}>Correo</label>
          <input
            id="reset-correo" type="email" autoComplete="email" placeholder="tu@empresa.com"
            className={s.input} value={correo} maxLength={LIMITES.usuario.correo}
            onChange={e => setCorreo(e.target.value)}
          />
        </div>

        <div className={s.campo}>
          <label htmlFor="reset-codigo" className={s.etiqueta}>Código de verificación</label>
          <input
            id="reset-codigo" type="text" autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="123456"
            className={s.input} value={codigo}
            style={{ textAlign: 'center', letterSpacing: '.5em', fontWeight: 700, fontSize: '1.25rem' }}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className={s.campo}>
          <label htmlFor="reset-nueva" className={s.etiqueta}>Nueva contraseña</label>
          <div className={s.conIcono}>
            <input
              id="reset-nueva" type={verClave ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
              className={s.input} value={nuevaPassword} maxLength={LIMITES.usuario.password_max}
              onChange={e => setNuevaPassword(e.target.value)}
            />
            {ojo}
          </div>
        </div>

        <div className={s.campo}>
          <label htmlFor="reset-confirmar" className={s.etiqueta}>Confirmar nueva contraseña</label>
          <input
            id="reset-confirmar" type={verClave ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
            className={s.input} value={confirmarPassword} maxLength={LIMITES.usuario.password_max}
            onChange={e => setConfirmarPassword(e.target.value)}
          />
        </div>

        <button type="submit" className={s.btn} disabled={restablecer.isPending}>
          {restablecer.isPending
            ? <><span className={s.girando} aria-hidden="true" /> Actualizando…</>
            : <>Guardar contraseña <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className={`${s.pie} ${s.aparece}`} style={{ animationDelay: '.7s' }}>
        ¿No recibiste el código? <Link to="/forgot-password" className={s.enlace}>Solicitar de nuevo</Link>
      </p>
    </AccesoLayout>
  );
}
