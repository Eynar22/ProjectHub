import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tarea } from './tarea.entity';
import { Usuario } from './usuario.entity';

@Entity('tarea_comentario')
export class TareaComentario {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  tarea_id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'text' })
  texto: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Tarea, (t) => t.comentarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tarea_id' })
  tarea: Tarea;

  @ManyToOne(() => Usuario, (u) => u.comentarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
