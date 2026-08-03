import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { Mensaje } from '../entities/mensaje.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    @InjectRepository(Mensaje) private mensajeRepo: Repository<Mensaje>,
  ) {}

  async findByProyecto(proyectoId: number) {
    const chat = await this.chatRepo.findOne({
      where: { proyecto_id: proyectoId },
      relations: ['mensajes', 'mensajes.usuario'],
    });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    return chat;
  }

  async findMessages(proyectoId: number) {
    const chat = await this.chatRepo.findOne({ where: { proyecto_id: proyectoId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');

    return this.mensajeRepo.find({
      where: { chat_id: chat.id },
      relations: ['usuario'],
      order: { fecha: 'ASC' },
    });
  }

  async createMessage(proyectoId: number, usuarioId: number, contenido: string, archivoUrl?: string) {
    let chat = await this.chatRepo.findOne({ where: { proyecto_id: proyectoId } });
    if (!chat) {
      chat = this.chatRepo.create({ proyecto_id: proyectoId });
      chat = await this.chatRepo.save(chat);
    }

    const mensaje = this.mensajeRepo.create({
      chat_id: chat.id,
      usuario_id: usuarioId,
      contenido,
      archivo_url: archivoUrl,
    });
    const saved = await this.mensajeRepo.save(mensaje);

    return this.mensajeRepo.findOne({
      where: { id: saved.id },
      relations: ['usuario'],
    });
  }
}
