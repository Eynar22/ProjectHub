import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseFilters, ParseIntPipe, UseInterceptors, UploadedFile, Req, ForbiddenException, PayloadTooLargeException, UnsupportedMediaTypeException, ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { MulterError } from 'multer';
import sharp from 'sharp';
import { RecursoService } from './recurso.service';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { Proyecto } from '../entities/proyecto.entity';

// Límites de subida: el techo de Multer cubre imagen o PDF; el PDF además
// tiene su propio tope más estricto porque no se recomprime.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB
const IMAGE_MAX_DIMENSION = 1600; // px, lado más largo
const IMAGE_JPEG_QUALITY = 80;
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
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    let outputBuffer: Buffer = file.buffer;
    let outputMimetype: string = file.mimetype;

    if (file.mimetype === 'application/pdf') {
      if (file.size > MAX_PDF_BYTES) {
        throw new PayloadTooLargeException(
          `El PDF supera el máximo permitido de ${MAX_PDF_BYTES / (1024 * 1024)}MB`,
        );
      }
    } else {
      // Imagen: redimensionar y comprimir para reducir el peso guardado/transmitido
      outputBuffer = await sharp(file.buffer)
        .rotate() // respeta la orientación EXIF antes de descartarla
        .resize({ width: IMAGE_MAX_DIMENSION, height: IMAGE_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
      outputMimetype = 'image/jpeg';
    }

    const base64 = outputBuffer.toString('base64');
    const base64String = `data:${outputMimetype};base64,${base64}`;

    return {
      base64: base64String,
      filename: file.originalname,
      mimetype: outputMimetype,
      size: outputBuffer.length,
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
