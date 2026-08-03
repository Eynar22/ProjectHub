import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { KanbanColumna } from './kanban-columna.entity';
import { Usuario } from './usuario.entity';
import { TareaComentario } from './tarea-comentario.entity';

@Entity('tarea')
export class Tarea {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'int' })
  columna_id: number;

  @ManyToMany(() => Usuario)
  @JoinTable({
    name: 'tarea_usuario',
    joinColumn: { name: 'tarea_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'usuario_id', referencedColumnName: 'id' }
  })
  usuarios: Usuario[];
  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 10 })
  prioridad: string; // 'baja' | 'media' | 'alta'

  @Column({ type: 'date', nullable: true })
  fecha_limite: string;

  @Column({ type: 'int' })
  orden: number;

  @ManyToOne(() => Proyecto, (p) => p.tareas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => KanbanColumna, (kc) => kc.tareas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columna_id' })
  columna: KanbanColumna;


  @OneToMany(() => TareaComentario, (tc) => tc.tarea, { cascade: true })
  comentarios: TareaComentario[];
}
