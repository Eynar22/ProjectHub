/* ============================================================================
 * src/pages/acceso/VistasAcceso.tsx
 * Ilustraciones vivas del panel derecho de las páginas de acceso. Cada página
 * tiene la suya y reacciona a lo que la persona escribe:
 *  - EspacioPrevio: login. Saluda con el nombre del correo; con la contraseña
 *    el contenido se desenfoca y aparece un candado.
 *  - RolesPrevio: registro, elegir camino. Resalta el rol que se mira.
 *  - FichaEmpresa / PerfilPrevio / Credencial: se arman en vivo con los datos.
 * Datos de ejemplo donde la persona aún no escribió nada.
 * ========================================================================= */

import { Building2, CheckCircle2, Clock, Lock, MessageSquare, UserRound, Users } from 'lucide-react';
import { ODS_POR_ID } from '@/shared/constants/ods';
import s from './Acceso.module.css';

/** Burbuja de chat apoyada en un punto (posición en %). */
function Burbuja({ texto, color, x, y, retraso = 0 }: { texto: string; color: string; x: string; y: string; retraso?: number }) {
  return (
    <span className={`${s.burbuja} ${s.flota}`} style={{ background: color, color: color === 'var(--tinta)' ? 'var(--sobre-tinta)' : undefined, left: x, top: y, animationDelay: `${retraso}s, ${retraso + 1}s` }}>
      {texto}
    </span>
  );
}

/* ───────────────────────── Login ───────────────────────── */

export function EspacioPrevio({ correo, privado }: { correo: string; privado: boolean }) {
  const usuario = correo.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const nombre = usuario ? usuario.charAt(0).toUpperCase() + usuario.slice(1) : '';
  const proyectos = [
    { t: 'Monitoreo de agua potable', avance: 72, color: ODS_POR_ID[6].color },
    { t: 'Software para cooperativas', avance: 45, color: ODS_POR_ID[8].color },
    { t: 'Energía solar en escuelas', avance: 90, color: ODS_POR_ID[7].color },
  ];
  return (
    <div className={s.vista}>
      <div className={`${s.ventanita} ${privado ? s.privado : ''}`}>
        <div className={s.ventCab}><i /><i /><i /><span>Tu espacio · ProjectHub</span></div>
        <div className={s.ventCuerpo}>
          <p className={s.saludo}>
            {nombre ? <>Hola, <b key={nombre} className={s.nombreVivo}>{nombre}</b></> : 'Tu espacio te espera'}
          </p>
          <p className={s.saludoSub}>Esto pasó mientras no estabas</p>
          <div className={s.avisos}>
            <span><MessageSquare size={15} /> 3 mensajes nuevos</span>
            <span><CheckCircle2 size={15} /> 5 tareas hechas</span>
          </div>
          {proyectos.map((p, i) => (
            <div key={p.t} className={s.filaProy} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
              <i style={{ background: p.color }} />
              <span>{p.t}</span>
              <b><em style={{ width: `${p.avance}%`, background: p.color }} /></b>
            </div>
          ))}
        </div>
        <div className={s.candado} aria-hidden="true"><Lock size={28} /> Contenido protegido</div>
      </div>
      <Burbuja texto={privado ? 'Tu clave está a salvo' : nombre ? '¡Qué bueno verte!' : '¡Hola de nuevo!'} color="var(--tinta)" x="8%" y="10%" retraso={0.6} />
      <Burbuja texto="Propuesta aceptada" color="var(--verde)" x="62%" y="82%" retraso={0.9} />
    </div>
  );
}

/* ───────────────────── Registro: elegir ───────────────────── */

export type Rol = 'unirse' | 'empresa' | 'independiente' | null;

export function RolesPrevio({ resaltado }: { resaltado: Rol }) {
  const roles = [
    {
      id: 'unirse' as const, icono: Users, t: 'Miembro', d: 'Te sumas al equipo de tu empresa', color: 'var(--azul)', img: '/images/landing/equipos.jpg',
      puntos: ['Buscas tu empresa y adjuntas un documento', 'El administrador aprueba tu solicitud', 'Trabajas en los proyectos de tu equipo'],
    },
    {
      id: 'empresa' as const, icono: Building2, t: 'Empresa', d: 'Publicas proyectos y eliges propuestas', color: 'var(--rojo)', img: '/images/landing/empresas.jpg',
      puntos: ['Registras tu empresa con su documentación', 'Publicas proyectos con un problema real', 'Eliges la mejor propuesta y formas tu equipo'],
    },
    {
      id: 'independiente' as const, icono: UserRound, t: 'Independiente', d: 'Postulas a los proyectos que te gusten', color: 'var(--verde)', img: '/images/landing/profesionales.jpg',
      puntos: ['Tu cuenta queda activa al instante', 'Postulas con tu propuesta y tu CV', 'Si te aceptan, te sumas al grupo de trabajo'],
    },
  ];
  // Con un rol elegido, su columna ocupa todo el panel y las otras se cierran.
  const columnas = roles.map(r => (resaltado === null ? '1fr' : resaltado === r.id ? '1fr' : '0fr')).join(' ');
  return (
    <div className={s.vista}>
      <div className={`${s.roles} ${resaltado ? s.rolesUno : ''}`} style={{ gridTemplateColumns: columnas }}>
        {roles.map((r, i) => {
          const on = resaltado === r.id;
          const oculto = resaltado !== null && !on;
          return (
            <div key={r.id} className={`${s.rol} ${on ? s.rolOn : ''} ${oculto ? s.rolOff : ''}`} style={{ animationDelay: `${0.2 + i * 0.12}s`, ['--c' as string]: r.color }}>
              <div className={s.rolFoto}><img src={r.img} alt="" /></div>
              <div className={s.rolTxt}>
                <span className={s.rolIcono}><r.icono size={18} /></span>
                <b>{r.t}</b>
                <small>{r.d}</small>
                {/* Detalle que solo se ve con la tarjeta expandida */}
                <ul className={s.rolPuntos}>
                  {r.puntos.map(p => <li key={p}><CheckCircle2 size={16} /> {p}</li>)}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────── Registro: empresa ───────────────────── */

type Valores = Record<string, string>;
const inicial = (t: string) => t.trim().charAt(0).toUpperCase() || '?';

export function FichaEmpresa({ v }: { v: Valores }) {
  const nombre = v.companyName?.trim() || 'Tu empresa';
  return (
    <div className={s.vista}>
      <div className={s.ficha}>
        <div className={s.fichaPortada}><img src="/images/landing/bolivia-mercado.jpg" alt="" /></div>
        <div className={s.fichaLogo}>{inicial(v.companyName || 'T')}</div>
        <div className={s.fichaCuerpo}>
          <b key={nombre} className={s.nombreVivo}>{nombre}</b>
          <p>{v.description?.trim() || 'Aquí aparecerá la descripción de tu empresa.'}</p>
          <div className={s.fichaDatos}>
            <span><Users size={14} /> {v.employees ? `${v.employees} empleados` : '— empleados'}</span>
            <span><UserRound size={14} /> {v.name?.trim() || 'Responsable'}{v.jobTitle ? ` · ${v.jobTitle}` : ''}</span>
          </div>
        </div>
      </div>
      <Burbuja texto="En revisión" color="var(--ambar)" x="70%" y="8%" retraso={0.6} />
      <Burbuja texto="Así te verán" color="var(--tinta)" x="6%" y="86%" retraso={0.8} />
    </div>
  );
}

/* ───────────────────── Registro: independiente ───────────────────── */

export function PerfilPrevio({ v }: { v: Valores }) {
  const nombre = v.name?.trim() || 'Tu nombre';
  return (
    <div className={s.vista}>
      <div className={s.perfil}>
        <div className={s.avatar}>{inicial(v.name || 'T')}</div>
        <b key={nombre} className={s.nombreVivo}>{nombre}</b>
        <span className={s.cargo}>{v.jobTitle?.trim() || 'Tu rol o profesión'}</span>
        <div className={s.chips}><span>Independiente</span><span>Disponible</span></div>
        <div className={s.postulaciones}>
          <small>Proyectos para postular</small>
          {['Monitoreo de agua potable', 'Energía solar en escuelas'].map((p, i) => (
            <div key={p} className={s.filaProy} style={{ animationDelay: `${0.4 + i * 0.12}s` }}><i style={{ background: i ? ODS_POR_ID[7].color : ODS_POR_ID[6].color }} /><span>{p}</span></div>
          ))}
        </div>
      </div>
      <Burbuja texto="Activa al instante" color="var(--verde)" x="66%" y="10%" retraso={0.6} />
    </div>
  );
}

/* ───────────────────── Registro: unirse ───────────────────── */

export function Credencial({ empresa, logo, v }: { empresa?: string; logo?: string | null; v: Valores }) {
  const nombre = v.name?.trim() || 'Tu nombre';
  return (
    <div className={s.vista}>
      <div className={s.credencial}>
        <div className={s.credCab}>
          {logo ? <img src={logo} alt="" /> : <span>{inicial(empresa || 'E')}</span>}
          <b>{empresa || 'Tu empresa'}</b>
        </div>
        <div className={s.credCuerpo}>
          <div className={s.avatar}>{inicial(v.name || 'T')}</div>
          <b key={nombre} className={s.nombreVivo}>{nombre}</b>
          <span className={s.cargo}>{v.jobTitle?.trim() || 'Tu cargo'}</span>
          <span className={s.sello}><Clock size={14} /> Pendiente de aprobación</span>
        </div>
        <div className={s.credPie}>Miembro · ProjectHub</div>
      </div>
      <Burbuja texto="El admin te aprueba" color="var(--azul)" x="62%" y="12%" retraso={0.6} />
    </div>
  );
}
