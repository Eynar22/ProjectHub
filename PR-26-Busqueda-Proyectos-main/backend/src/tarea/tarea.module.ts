import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TareaController } from './tarea.controller';
import { TareaService } from './tarea.service';
import { Tarea } from '../entities/tarea.entity';
import { TareaComentario } from '../entities/tarea-comentario.entity';
import { KanbanColumna } from '../entities/kanban-columna.entity';
import { Usuario } from '../entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tarea, TareaComentario, KanbanColumna, Usuario])],
  controllers: [TareaController],
  providers: [TareaService],
  exports: [TareaService],
})
export class TareaModule {}
