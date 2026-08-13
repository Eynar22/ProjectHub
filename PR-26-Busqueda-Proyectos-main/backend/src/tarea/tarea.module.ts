import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TareaController } from './tarea.controller';
import { TareaService } from './tarea.service';
import { Tarea } from '../entities/tarea.entity';
import { TareaComentario } from '../entities/tarea-comentario.entity';
import { KanbanColumna } from '../entities/kanban-columna.entity';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tarea, TareaComentario, KanbanColumna, Usuario, UsuarioProyecto])],
  controllers: [TareaController],
  providers: [TareaService],
  exports: [TareaService],
})
export class TareaModule {}
