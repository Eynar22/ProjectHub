import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Tarea } from './tarea.entity';

@Entity('kanban_columna')
export class KanbanColumna {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'int' })
  orden: number;

  @ManyToOne(() => Proyecto, (p) => p.columnas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @OneToMany(() => Tarea, (t) => t.columna, { cascade: true })
  tareas: Tarea[];
}
