import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoService } from './recurso.service';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { Proyecto } from '../entities/proyecto.entity';

@Controller('recursos')
@UseGuards(AuthGuard('jwt'))
export class RecursoController {
  constructor(
    private recursoService: RecursoService,
    @InjectRepository(UsuarioProyecto) private upRepo: Repository<UsuarioProyecto>,
    @InjectRepository(Proyecto) private proyectoRepo: Repository<Proyecto>,
  ) {}

  // Verificar que el usuario sea colaborador del proyecto
  private async verificarAccesoAlProyecto(usuarioId: number, proyectoId: number) {
    const participante = await this.upRepo.findOne({
      where: { usuario_id: usuarioId, proyecto_id: proyectoId },
    });
    if (!participante) {
      throw new ForbiddenException('No tienes acceso a los recursos de este proyecto');
    }
  }

  @Get('proyecto/:proyectoId')
  async findByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number, @Req() req: any) {
    await this.verificarAccesoAlProyecto(req.user.id, proyectoId);
    return this.recursoService.findByProyecto(proyectoId);
  }

  @Get('proyecto/:proyectoId/raiz')
  async findRootByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number, @Req() req: any) {
    await this.verificarAccesoAlProyecto(req.user.id, proyectoId);
    return this.recursoService.findRootByProyecto(proyectoId);
  }

  @Get('carpeta/:padreId')
  findByParent(@Param('padreId', ParseIntPipe) padreId: number) {
    return this.recursoService.findByParent(padreId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recursoService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.recursoService.create(data);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    // Convert file to base64
    const base64 = file.buffer.toString('base64');
    const base64String = `data:${file.mimetype};base64,${base64}`;
    
    return {
      base64: base64String,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.recursoService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recursoService.remove(id);
  }
}
