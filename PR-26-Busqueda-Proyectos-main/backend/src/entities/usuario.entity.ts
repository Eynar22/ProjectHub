import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, ManyToMany } from 'typeorm';
import { Empresa } from './empresa.entity';
import { UsuarioProyecto } from './usuario-proyecto.entity';
import { Mensaje } from './mensaje.entity';
import { Tarea } from './tarea.entity';
import { TareaComentario } from './tarea-comentario.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo: string;

  @Column({ type: 'text', select: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  documento_url: string;

  @Column({ type: 'varchar', length: 20 })
  rol: string;

  @Column({ type: 'smallint', nullable: true })
  empresa_id: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha_registro: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany(() => UsuarioProyecto, (up) => up.usuario)
  proyectos: UsuarioProyecto[];

  @OneToMany(() => Mensaje, (m) => m.usuario)
  mensajes: Mensaje[];

  @ManyToMany(() => Tarea, (t) => t.usuarios)
  tareas: Tarea[];

  @OneToMany(() => TareaComentario, (tc) => tc.usuario)
  comentarios: TareaComentario[];
}
