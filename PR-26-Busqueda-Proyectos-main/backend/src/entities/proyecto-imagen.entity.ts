import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity('proyecto_imagen')
export class ProyectoImagen {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'text' })
  url: string;

  @ManyToOne(() => Proyecto, (p) => p.imagenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;
}
