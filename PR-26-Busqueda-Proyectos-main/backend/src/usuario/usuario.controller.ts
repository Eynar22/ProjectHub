import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioService } from './usuario.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('usuarios')
@UseGuards(AuthGuard('jwt'))
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Get()
  findAll(@Query('empresa_id') empresaId?: string) {
    if (empresaId) {
      return this.usuarioService.findByEmpresa(parseInt(empresaId, 10));
    }
    return this.usuarioService.findAll();
  }

  // Membership requests — must be declared BEFORE ':id' to avoid route conflict
  @Get('solicitudes/empresa/:empresaId')
  findMembershipRequests(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.usuarioService.findMembershipRequests(empresaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.usuarioService.update(id, data);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id/promover')
  promote(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.promoteToAdmin(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id/degradar')
  demote(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.demoteToEmpleado(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Patch(':id/bloquear')
  blockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.blockUser(id);
  }

  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Patch(':id/desbloquear')
  unblockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.unblockUser(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch('solicitudes/:id/aprobar')
  approveMembership(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.approveMembership(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch('solicitudes/:id/rechazar')
  rejectMembership(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.rejectMembership(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete('solicitudes/:id')
  deleteMembership(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.deleteMembership(id);
  }
}
