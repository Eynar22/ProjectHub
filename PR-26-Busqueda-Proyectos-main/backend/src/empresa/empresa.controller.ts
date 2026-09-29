import { BadRequestException, Controller, Get, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmpresaService } from './empresa.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ValidarCampos } from '../common/validacion/validar-campos.pipe';
import { ESQUEMA_EMPRESA } from '../common/validacion/esquemas';
import { LIMITES } from '../common/validacion/limites';

@Controller('empresas')
export class EmpresaController {
  constructor(private empresaService: EmpresaService) {}

  @Get()
  findAll() {
    return this.empresaService.findAll();
  }

  @Get('aprobadas')
  findApproved() {
    return this.empresaService.findApproved();
  }

  /** Directorio público de empresas aprobadas (sin sesión, solo datos públicos). */
  @Get('publicas')
  findPublicas() {
    return this.empresaService.findPublicas();
  }

  @Get('publicas/:id')
  findPublica(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findPublica(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  // Un admin solo puede editar su propia empresa (verificado en el service
  // contra su empresa_id real en BD); superadmin puede editar cualquiera.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body(new ValidarCampos(ESQUEMA_EMPRESA, true)) data: any) {
    if (data.enlaces !== undefined) {
      if (!Array.isArray(data.enlaces)) throw new BadRequestException('Los enlaces no son válidos.');
      for (const e of data.enlaces) {
        if (!e?.url || typeof e.url !== 'string') throw new BadRequestException('Cada enlace necesita una URL.');
        if (e.url.length > LIMITES.empresa.enlace_url)
          throw new BadRequestException(`La URL del enlace no puede superar ${LIMITES.empresa.enlace_url} caracteres.`);
        if (e.nombre && String(e.nombre).length > LIMITES.empresa.enlace_nombre)
          throw new BadRequestException(`El nombre del enlace no puede superar ${LIMITES.empresa.enlace_nombre} caracteres.`);
      }
    }
    return this.empresaService.update(id, data, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  @Patch(':id/aprobar')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.approve(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  @Patch(':id/bloquear')
  block(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.block(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  @Patch(':id/desbloquear')
  unblock(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.unblock(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.remove(id);
  }
}
