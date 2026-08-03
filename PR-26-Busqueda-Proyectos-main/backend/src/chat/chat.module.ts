import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from '../entities/chat.entity';
import { Mensaje } from '../entities/mensaje.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Mensaje])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
