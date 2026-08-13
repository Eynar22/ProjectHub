import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TareaService } from './tarea.service';

@Controller('tareas')
@UseGuards(AuthGuard('jwt'))
export class TareaController {
  constructor(private tareaService: TareaService) {}

  // Kanban columns
  @Get('columnas/proyecto/:proyectoId')
  findColumnas(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.tareaService.findColumnas(proyectoId);
  }

  @Post('columnas')
  createColumna(@Body() body: { proyecto_id: number; nombre: string; orden: number }) {
    return this.tareaService.createColumna(body.proyecto_id, body.nombre, body.orden);
  }

  @Patch('columnas/:id')
  updateColumna(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.tareaService.updateColumna(id, data);
  }

  @Delete('columnas/:id')
  deleteColumna(@Param('id', ParseIntPipe) id: number) {
    return this.tareaService.deleteColumna(id);
  }

  // Tasks
  @Get('proyecto/:proyectoId')
  findByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.tareaService.findByProyecto(proyectoId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tareaService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Request() req: any) {
    return this.tareaService.create(data, req.user.id);
  }

  // Asignados — must be before generic /:id PATCH
  @Patch(':id/asignados')
  updateAsignados(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { usuario_ids: number[] },
  ) {
    return this.tareaService.updateAsignados(id, body.usuario_ids);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.tareaService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tareaService.remove(id);
  }

  // Comments
  @Post(':tareaId/comentarios')
  addComment(
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Body() body: { texto: string },
    @Request() req: any,
  ) {
    return this.tareaService.addComment(tareaId, req.user.id, body.texto);
  }

  @Delete('comentarios/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.tareaService.deleteComment(id);
  }
}
