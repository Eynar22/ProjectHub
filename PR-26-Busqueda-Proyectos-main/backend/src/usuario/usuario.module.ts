import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { Usuario } from '../entities/usuario.entity';
import { SolicitudMembresia } from '../entities/solicitud-membresia.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, SolicitudMembresia, Proyecto, UsuarioProyecto]),
    MailModule,
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
