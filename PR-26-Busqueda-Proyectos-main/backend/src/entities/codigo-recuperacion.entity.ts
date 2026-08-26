import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('codigo_recuperacion')
export class CodigoRecuperacion {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'varchar', length: 6 })
  codigo: string;

  @Column({ type: 'timestamp' })
  fecha_expiracion: Date;

  @Column({ type: 'boolean', default: false })
  usado: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
