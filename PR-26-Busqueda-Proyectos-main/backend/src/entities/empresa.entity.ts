import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('empresa')
export class Empresa {
  @PrimaryGeneratedColumn('identity', { type: 'smallint' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  num_empleados: number;

  @Column({ type: 'varchar', length: 250, nullable: true })
  portafolio: string;

  @Column({ type: 'text', nullable: true })
  documento_url: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha_registro: string;

  @Column({ type: 'date', nullable: true })
  fecha_aprobacion?: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string;

  @OneToMany(() => Usuario, (usuario) => usuario.empresa)
  usuarios: Usuario[];
}
