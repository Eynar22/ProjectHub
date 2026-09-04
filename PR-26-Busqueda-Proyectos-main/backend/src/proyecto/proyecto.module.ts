import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyectoController } from './proyecto.controller';
import { ProyectoService } from './proyecto.service';
import { Proyecto } from '../entities/proyecto.entity';
import { ProyectoImagen } from '../entities/proyecto-imagen.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { SolicitudProyecto } from '../entities/solicitud-proyecto.entity';
import { Usuario } from '../entities/usuario.entity';
import { Chat } from '../entities/chat.entity';
import { KanbanColumna } from '../entities/kanban-columna.entity';
import { Recurso } from '../entities/recurso.entity';
import { AlmacenamientoModule } from '../almacenamiento/almacenamiento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      ProyectoImagen,
      UsuarioProyecto,
      SolicitudProyecto,
      Usuario,
      Chat,
      KanbanColumna,
      Recurso,
    ]),
    AlmacenamientoModule,
  ],
  controllers: [ProyectoController],
  providers: [ProyectoService],
  exports: [ProyectoService],
})
export class ProyectoModule {}
