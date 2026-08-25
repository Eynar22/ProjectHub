import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';
import { Empresa } from '../entities/empresa.entity';
import { EmpresaImagen } from '../entities/empresa-imagen.entity';
import { EmpresaEnlace } from '../entities/empresa-enlace.entity';
import { Usuario } from '../entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, EmpresaImagen, EmpresaEnlace, Usuario])],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService],
})
export class EmpresaModule {}
