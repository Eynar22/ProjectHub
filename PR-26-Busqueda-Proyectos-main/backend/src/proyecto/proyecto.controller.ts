import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProyectoService } from './proyecto.service';

@Controller('proyectos')
export class ProyectoController {
  constructor(private proyectoService: ProyectoService) { }

  @Get()
  findAll() {
    return this.proyectoService.findAll();
  }

  /** Superadmin only: returns ALL projects regardless of estado */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/todos')
  findAllAdmin(@Request() req: any) {
    if (req.user.rol !== 'superadmin') {
      return this.proyectoService.findAll();
    }
    return this.proyectoService.findAllAdmin();
  }

  /** Returns archived projects (superadmin sees all, owner sees only theirs) */
  @UseGuards(AuthGuard('jwt'))
  @Get('archivados')
  findArchivados(@Request() req: any) {
    return this.proyectoService.findArchivados(req.user.id, req.user.rol);
  }

  /** Trigger auto-termination of expired projects (superadmin only) */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/auto-terminar')
  autoTerminar(@Request() req: any) {
    if (req.user.rol !== 'superadmin') {
      return { message: 'No autorizado' };
    }
    return this.proyectoService.autoTerminarProyectos();
  }

  // Must be before ':id' to avoid route conflict
  @UseGuards(AuthGuard('jwt'))
  @Get('usuario/mis-proyectos')
  findMyProjects(@Request() req: any) {
    return this.proyectoService.findByUser(req.user.id);
  }


  // Returns all pending join requests grouped by project for the authenticated owner
  @UseGuards(AuthGuard('jwt'))
  @Get('usuario/solicitudes-pendientes')
  findMyPendingRequests(@Request() req: any) {
    return this.proyectoService.findPendingRequestsByOwner(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('usuario/solicitudes-enviadas')
  findMySentRequests(@Request() req: any) {
    return this.proyectoService.findRequestsByUser(req.user.id);
  }

  // Must be before ':proyectoId/solicitudes' to avoid conflict
  @UseGuards(AuthGuard('jwt'))
  @Patch('solicitudes/:solicitudId/aceptar')
  acceptRequest(@Param('solicitudId', ParseIntPipe) solicitudId: number) {
    return this.proyectoService.acceptRequest(solicitudId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('solicitudes/:solicitudId/rechazar')
  rejectRequest(@Param('solicitudId', ParseIntPipe) solicitudId: number) {
    return this.proyectoService.rejectRequest(solicitudId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proyectoService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() data: any, @Request() req: any) {
    // Solo el administrador de una empresa (o el superadmin) puede publicar
    // proyectos. Los empleados y usuarios independientes no.
    if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
      throw new ForbiddenException('Solo un administrador de empresa puede crear proyectos');
    }
    return this.proyectoService.create({ ...data, creador_id: req.user.id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.proyectoService.update(id, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proyectoService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string },
    @Request() req: any,
  ) {
    return this.proyectoService.updateEstado(id, body.estado as any, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/transferir')
  transferir(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nuevo_creador_id: number },
    @Request() req: any,
  ) {
    // Service will verify if req.user has permission (superadmin or company admin)
    return this.proyectoService.transferirPropiedad(id, body.nuevo_creador_id, req.user);
  }

  // Participants
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/participantes')
  addParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { usuario_id: number; rol?: string },
  ) {
    return this.proyectoService.addParticipant(id, body.usuario_id, body.rol);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/participantes/:usuarioId')
  removeParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Request() req: any,
  ) {
    return this.proyectoService.removeParticipant(id, usuarioId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/participantes/:usuarioId')
  updateParticipantRol(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() body: { rol: string },
    @Request() req: any,
  ) {
    return this.proyectoService.updateParticipantRol(id, usuarioId, body.rol, req.user);
  }

  // Join requests
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/solicitudes')
  findRequests(@Param('id', ParseIntPipe) id: number) {
    return this.proyectoService.findRequests(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/solicitudes')
  createRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { mensaje?: string; propuesta?: string; cv_url?: string },
    @Request() req: any,
  ) {
    return this.proyectoService.createRequest(id, req.user.id, body);
  }
}
