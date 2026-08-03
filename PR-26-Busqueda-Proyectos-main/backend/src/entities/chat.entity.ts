import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Mensaje } from './mensaje.entity';

@Entity('chat')
export class Chat {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int', unique: true })
  proyecto_id: number;

  @OneToOne(() => Proyecto, (p) => p.chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @OneToMany(() => Mensaje, (m) => m.chat, { cascade: true })
  mensajes: Mensaje[];
}
