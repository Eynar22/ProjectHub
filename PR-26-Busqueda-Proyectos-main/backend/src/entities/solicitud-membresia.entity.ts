import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Usuario } from './usuario.entity';

@Entity('solicitud_membresia')
export class SolicitudMembresia {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'smallint' })
  empresa_id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'text', nullable: true })
  documento_url: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string; // 'pendiente' | 'aprobado' | 'rechazado'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
