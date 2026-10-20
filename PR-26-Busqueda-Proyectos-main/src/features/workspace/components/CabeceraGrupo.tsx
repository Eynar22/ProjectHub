/* ============================================================================
 * src/features/workspace/components/CabeceraGrupo.tsx
 * Cabecera del grupo de trabajo, en la línea visual de la portada: la foto del
 * proyecto de fondo con un velo carbón, el nombre grande, la empresa, el
 * estado, el equipo (avatares), el avance de tareas y los días que quedan.
 * Abajo, las pestañas como píldoras, fijas al bajar.
 * ========================================================================= */

import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, CalendarClock, Crown, ListChecks } from 'lucide-react';
import { Avatar } from '@/shared/components/ui/Avatar';
import type { Project } from '@/features/proyectos';
import type { WorkspaceMember } from './types';
import type { KanbanColumn, Task } from '../types/workspace.types';
import s from './CabeceraGrupo.module.css';

const ESTADO: Record<string, string> = {
  en_curso: 'En curso',
  terminado: 'Terminado',
  archivado: 'Archivado',
};

interface Pestana { id: string; label: string; icon?: ComponentType<{ className?: string }>; badge?: number }

export function CabeceraGrupo({ project, empresa, isOwner, equipo, columnas, tareas, pestanas, activa, onCambiar }: {
  project: Project;
  empresa?: { nombre: string; logo_url?: string | null } | null;
  isOwner: boolean;
  equipo: WorkspaceMember[];
  columnas: KanbanColumn[];
  tareas: Task[];
  pestanas: Pestana[];
  activa: string;
  onCambiar: (id: string) => void;
}) {
  const foto = project.imagenes?.[0]?.url;
  // "Hecha" = está en la última columna del tablero.
  const ultima = columnas.reduce<KanbanColumn | null>((m, c) => (!m || c.orden > m.orden ? c : m), null);
  const hechas = ultima ? tareas.filter(t => t.columna_id === ultima.id).length : 0;
  const avance = tareas.length ? Math.round((hechas / tareas.length) * 100) : 0;

  const fin = project.fecha_fin ? new Date(project.fecha_fin + 'T23:59:59') : null;
  const dias = fin ? Math.ceil((fin.getTime() - Date.now()) / 86_400_000) : null;
  const plazo = dias === null ? 'Sin fecha de cierre'
    : project.estado === 'terminado' ? 'Proyecto terminado'
    : dias < 0 ? `Venció hace ${-dias} día${dias === -1 ? '' : 's'}`
    : dias === 0 ? 'Cierra hoy'
    : `${dias} día${dias === 1 ? '' : 's'} restantes`;

  const MAX_AVATARES = 5;

  return (
    <header className={s.cabecera}>
      <div className={s.fondo} aria-hidden="true">
        {foto && <img src={foto} alt="" />}
      </div>
      <span className={s.rayas} aria-hidden="true" />

      <div className={s.contenido}>
        <Link to="/dashboard" className={s.volver}><ArrowLeft size={16} /> Volver al panel</Link>

        <div className={s.titular}>
          <div className={s.marcaEmpresa}>
            {empresa?.logo_url
              ? <img src={empresa.logo_url} alt="" />
              : <span>{(empresa?.nombre ?? project.nombre).charAt(0).toUpperCase()}</span>}
          </div>
          <div className={s.textos}>
            <div className={s.etiquetas}>
              <span className={s.estado} data-estado={project.estado || 'en_curso'}>{ESTADO[project.estado || 'en_curso'] ?? 'En curso'}</span>
              {isOwner && <span className={s.propietario}><Crown size={13} /> Propietario</span>}
            </div>
            <h1 className={s.nombre}>{project.nombre}</h1>
            {empresa?.nombre && <p className={s.empresa}>{empresa.nombre}</p>}
          </div>
        </div>

        <div className={s.metricas}>
          <div className={s.metrica}>
            <div className={s.avatares}>
              {equipo.slice(0, MAX_AVATARES).map(u => (
                <Avatar key={u.id} name={u.nombre_completo} src={u.foto_url} className={s.avatar} fallbackClassName={s.avatarIniciales} />
              ))}
              {equipo.length > MAX_AVATARES && <span className={`${s.avatar} ${s.avatarMas}`}>+{equipo.length - MAX_AVATARES}</span>}
            </div>
            <span><b>{equipo.length}</b> {equipo.length === 1 ? 'integrante' : 'integrantes'}</span>
          </div>

          <div className={s.metrica}>
            <ListChecks size={20} className={s.icono} />
            <div className={s.avance}>
              <span><b>{hechas}/{tareas.length}</b> tareas hechas</span>
              <i><b style={{ width: `${avance}%` }} /></i>
            </div>
          </div>

          <div className={s.metrica}>
            <CalendarClock size={20} className={s.icono} />
            <span><b>{plazo}</b>{fin && <small>Cierre: {fin.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}</small>}</span>
          </div>
        </div>
      </div>

      <nav className={s.pestanas} role="tablist" aria-label="Secciones del grupo de trabajo">
        {pestanas.map(({ id, label, icon: Icono, badge }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === activa}
            className={id === activa ? s.pestanaOn : s.pestana}
            onClick={() => onCambiar(id)}
          >
            {Icono && <Icono className={s.pestanaIcono} />}
            {label}
            {!!badge && <span className={s.contador}>{badge}</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}
