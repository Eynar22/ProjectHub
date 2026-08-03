import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmpresaService } from './empresa.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.empresaService.update(id, data);
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
