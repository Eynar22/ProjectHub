import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Proyecto } from './proyecto.entity';

@Entity('usuario_proyecto')
export class UsuarioProyecto {
  @PrimaryColumn({ type: 'int' })
  usuario_id: number;

  @PrimaryColumn({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'varchar', length: 20 })
  rol: string; // 'admin' | 'colaborador'

  @ManyToOne(() => Usuario, (u) => u.proyectos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Proyecto, (p) => p.participantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;
}
