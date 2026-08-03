import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from './usuario.entity';

@Entity('solicitud_proyecto')
export class SolicitudProyecto {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'text', nullable: true })
  mensaje: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string; // 'pendiente' | 'aceptado' | 'rechazado'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
