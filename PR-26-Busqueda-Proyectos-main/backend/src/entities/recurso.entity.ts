import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity('recurso')
export class Recurso {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 10 })
  tipo: string; // 'archivo' | 'carpeta'

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'int', nullable: true })
  padre_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Proyecto, (p) => p.recursos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => Recurso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'padre_id' })
  padre: Recurso;
}
