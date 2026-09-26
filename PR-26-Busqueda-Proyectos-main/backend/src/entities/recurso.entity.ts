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

  // true solo para lo creado al publicar el proyecto (galería + documento de
  // acreditación y sus carpetas contenedoras): es lo único que devuelve la
  // página pública /project/:id. Lo que el equipo sube después desde el
  // workspace queda en false y solo lo ven los participantes del proyecto.
  @Column({ type: 'boolean', default: false })
  es_publico: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Proyecto, (p) => p.recursos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => Recurso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'padre_id' })
  padre: Recurso;
}
