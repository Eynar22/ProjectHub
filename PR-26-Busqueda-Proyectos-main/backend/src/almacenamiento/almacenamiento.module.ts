import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archivo } from '../entities/archivo.entity';
import { AlmacenamientoService } from './almacenamiento.service';
import { LimpiezaArchivosService } from './limpieza-archivos.service';
import {
  ArchivosController,
  AlmacenamientoController,
} from './almacenamiento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Archivo])],
  controllers: [ArchivosController, AlmacenamientoController],
  providers: [AlmacenamientoService, LimpiezaArchivosService],
  exports: [AlmacenamientoService],
})
export class AlmacenamientoModule {}
