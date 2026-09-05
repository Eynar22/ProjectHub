import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UseFilters, ParseIntPipe, UseInterceptors, UploadedFile, Req, ForbiddenException, PayloadTooLargeException, UnsupportedMediaTypeException, ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { MulterError } from 'multer';
import { RecursoService } from './recurso.service';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';

// El techo de Multer cubre imagen o PDF; el resto de límites y la compresión
// viven en AlmacenamientoService.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

// Cuando Multer corta la subida por el límite de MAX_UPLOAD_BYTES, lanza un MulterError
// crudo antes de que el controller pueda validarlo, así que Nest lo devolvería como un
// 500 genérico sin mensaje. Lo interceptamos para responder igual que el resto de errores de tamaño.
@Catch(MulterError)
class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message = exception.code === 'LIMIT_FILE_SIZE'
      ? `El archivo supera el máximo permitido de ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`
      : exception.message;
    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message,
    });
  }
}

@Controller('recursos')
@UseGuards(AuthGuard('jwt'))
export class RecursoController {
  constructor(
    private recursoService: RecursoService,
    private almacenamiento: AlmacenamientoService,
    @InjectRepository(UsuarioProyecto) private upRepo: Repository<UsuarioProyecto>,
    @InjectRepository(Proyecto) private proyectoRepo: Repository<Proyecto>,
  ) {}

  // Verificar que el usuario sea colaborador del proyecto (o superadmin, que
  // tiene acceso a cualquier proyecto igual que en el resto de la app).
  private async verificarAccesoAlProyecto(usuario: { id: number; rol: string }, proyectoId: number) {
    if (usuario.rol === 'superadmin') return;
    const participante = await this.upRepo.findOne({
      where: { usuario_id: usuario.id, proyecto_id: proyectoId },
    });
    if (!participante) {
      throw new ForbiddenException('No tienes acceso a los recursos de este proyecto');
    }
  }

  @Get('proyecto/:proyectoId')
  async findByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number, @Req() req: any) {
    await this.verificarAccesoAlProyecto(req.user, proyectoId);
    return this.recursoService.findByProyecto(proyectoId);
  }

  @Get('proyecto/:proyectoId/raiz')
  async findRootByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number, @Req() req: any) {
    await this.verificarAccesoAlProyecto(req.user, proyectoId);
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
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
          cb(new UnsupportedMediaTypeException('Solo se permiten imágenes (JPG, PNG, WEBP, GIF) o archivos PDF'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Query('bucket') bucketQuery: string | undefined,
    @Req() req: any,
  ) {
    if (!file) {
      throw new PayloadTooLargeException('No se recibió ningún archivo');
    }

    // Por defecto todo va al bucket público: los recursos de un proyecto (imágenes
    // Y PDF) y el documento del proyecto los ve cualquier participante y no tiene
    // sentido re-descargarlos con fetch+blob cada vez. El que sube algo sensible
    // (CV / propuesta de una postulación) pasa `?bucket=privado` explícitamente.
    const bucket: 'publico' | 'privado' = bucketQuery === 'privado' ? 'privado' : 'publico';
    const guardado = await this.almacenamiento.guardarDesdeMulter(file, bucket, req.user?.id ?? null);

    return {
      url: guardado.url,
      filename: guardado.nombre_original ?? file.originalname,
      mimetype: guardado.mimetype,
      size: guardado.size_bytes,
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
