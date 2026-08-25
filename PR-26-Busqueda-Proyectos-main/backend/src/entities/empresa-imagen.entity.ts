import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('empresa_imagen')
export class EmpresaImagen {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  empresa_id: number;

  @Column({ type: 'text' })
  url: string;

  @ManyToOne(() => Empresa, (e) => e.imagenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
}
