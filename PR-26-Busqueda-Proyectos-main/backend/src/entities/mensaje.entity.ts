import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { Usuario } from './usuario.entity';

@Entity('mensaje')
export class Mensaje {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'int' })
  chat_id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'text', nullable: true })
  contenido: string;

  @Column({ type: 'text', nullable: true })
  archivo_url: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @ManyToOne(() => Chat, (c) => c.mensajes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToOne(() => Usuario, (u) => u.mensajes)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
