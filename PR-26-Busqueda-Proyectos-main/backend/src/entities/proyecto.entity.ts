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

  @Column({ type: 'varchar', length: 20, default: 'en_curso' })
  estado: 'en_curso' | 'terminado' | 'archivado';

  @Column({ type: 'boolean', default: false })
  suspendido: boolean;

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
