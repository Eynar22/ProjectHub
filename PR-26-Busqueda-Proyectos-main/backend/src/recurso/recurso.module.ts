import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecursoController } from './recurso.controller';
import { RecursoService } from './recurso.service';
import { Recurso } from '../entities/recurso.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { AlmacenamientoModule } from '../almacenamiento/almacenamiento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recurso, UsuarioProyecto, Proyecto]),
    AlmacenamientoModule,
  ],
  controllers: [RecursoController],
  providers: [RecursoService],
  exports: [RecursoService],
})
export class RecursoModule {}
