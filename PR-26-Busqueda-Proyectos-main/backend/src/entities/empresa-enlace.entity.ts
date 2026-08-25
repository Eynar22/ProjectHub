import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('empresa_enlace')
export class EmpresaEnlace {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  empresa_id: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string;

  @ManyToOne(() => Empresa, (e) => e.enlaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
}
