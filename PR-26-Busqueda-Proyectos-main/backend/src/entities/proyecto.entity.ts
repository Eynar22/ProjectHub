import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ProyectoImagen } from './proyecto-imagen.entity';
import { UsuarioProyecto } from './usuario-proyecto.entity';
import { Chat } from './chat.entity';
import { KanbanColumna } from './kanban-columna.entity';
import { Tarea } from './tarea.entity';
import { Recurso } from './recurso.entity';
import { Usuario } from './usuario.entity';

@Entity('proyecto')
export class Proyecto {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion_corta: string;

  @Column({ type: 'text', nullable: true })
  descripcion_completa: string;

  // Problema que el proyecto busca resolver. Se pide obligatorio al crear
  // (formulario completo y wizard) y se muestra en el detalle público;
  // nullable en BD por los proyectos creados antes de este campo.
  @Column({ type: 'text', nullable: true })
  problema: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  financiamiento: number;

  @Column({ type: 'text', nullable: true })
  documento_url: string;

  @Column({ type: 'varchar', length: 100, default: 'Tecnología' })
  categoria: string;

  // Objetivos de Desarrollo Sostenible (ODS) de la ONU a los que aporta el
  // proyecto. Se elige al crear (varios posibles). Guardado como JSON de ids
  // 1..17 en una columna text; nullable por los proyectos previos a este campo.
  @Column({ type: 'simple-json', nullable: true })
  ods: number[];

  @Column({ type: 'varchar', length: 20, default: 'en_curso' })
  estado: 'en_curso' | 'terminado' | 'archivado';

  @Column({ type: 'boolean', default: false })
  suspendido: boolean;

  // Sello inmutable de alta del proyecto (para métricas de crecimiento). Distinto
  // de fecha_inicio, que es la fecha planificada y editable.
  @Column({ type: 'timestamp', default: () => 'now()' })
  fecha_creacion: Date;

  @Column({ type: 'int', nullable: false })
  creador_id: number;

  @ManyToOne(() => Usuario, { lazy: true })
  @JoinColumn({ name: 'creador_id' })
  creador?: Usuario;

  @OneToMany(() => ProyectoImagen, (pi) => pi.proyecto, { cascade: true })
  imagenes: ProyectoImagen[];

  @OneToMany(() => UsuarioProyecto, (up) => up.proyecto, { cascade: true })
  participantes: UsuarioProyecto[];

  @OneToOne(() => Chat, (chat) => chat.proyecto, { cascade: true })
  chat: Chat;

  @OneToMany(() => KanbanColumna, (kc) => kc.proyecto, { cascade: true })
  columnas: KanbanColumna[];

  @OneToMany(() => Tarea, (t) => t.proyecto)
  tareas: Tarea[];

  @OneToMany(() => Recurso, (r) => r.proyecto, { cascade: true })
  recursos: Recurso[];
}
