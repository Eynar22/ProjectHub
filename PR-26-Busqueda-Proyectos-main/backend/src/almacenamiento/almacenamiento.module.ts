import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archivo } from '../entities/archivo.entity';
import { AlmacenamientoService } from './almacenamiento.service';
import {
  ArchivosController,
  AlmacenamientoController,
} from './almacenamiento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Archivo])],
  controllers: [ArchivosController, AlmacenamientoController],
  providers: [AlmacenamientoService],
  exports: [AlmacenamientoService],
})
export class AlmacenamientoModule {}
