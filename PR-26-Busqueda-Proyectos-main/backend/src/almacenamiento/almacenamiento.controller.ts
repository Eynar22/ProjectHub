import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseFilters,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MulterError } from 'multer';
import { AlmacenamientoService } from './almacenamiento.service';
import {
  ALLOWED_MIMETYPES,
  Bucket,
  MAX_UPLOAD_BYTES,
} from './almacenamiento.constants';

// Multer corta la subida por tamaño antes de que el controller pueda validar;
// sin este filtro Nest devolvería un 500 sin mensaje.
@Catch(MulterError)
class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? `El archivo supera el máximo permitido de ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`
        : exception.message;
    res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message,
    });
  }
}

@Controller('archivos')
export class ArchivosController {
  constructor(private readonly almacenamiento: AlmacenamientoService) {}

  /** Sube un archivo. Devuelve { url, ... }; la url se guarda en la columna *_url. */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMETYPES.includes(file.mimetype as any)) {
          cb(new BadRequestException('Tipo de archivo no permitido'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async subir(
    @UploadedFile() file: any,
    @Query('bucket') bucketQuery: string | undefined,
    @Req() req: any,
  ) {
    const bucket: Bucket = bucketQuery === 'publico' ? 'publico' : 'privado';
    return this.almacenamiento.guardarDesdeMulter(file, bucket, req.user?.id ?? null);
  }

  /** Bucket público: sin auth, cache larga (nombre UUID no adivinable). */
  @Get('publico/:anio/:mes/:nombre')
  async servirPublico(
    @Param('anio') anio: string,
    @Param('mes') mes: string,
    @Param('nombre') nombre: string,
    @Res() res: Response,
  ) {
    const { rutaFisica, archivo } = await this.almacenamiento.resolverParaServir(
      'publico',
      anio,
      mes,
      nombre,
    );
    res.setHeader('Content-Type', archivo.mimetype);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(rutaFisica);
  }

  /** Bucket privado: requiere sesión y permiso sobre el archivo. */
  @Get('privado/:anio/:mes/:nombre')
  @UseGuards(AuthGuard('jwt'))
  async servirPrivado(
    @Param('anio') anio: string,
    @Param('mes') mes: string,
    @Param('nombre') nombre: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { rutaFisica, archivo } = await this.almacenamiento.resolverParaServir(
      'privado',
      anio,
      mes,
      nombre,
    );
    if (!this.almacenamiento.puedeVerPrivado(req.user, archivo)) {
      throw new ForbiddenException('No tienes permiso para ver este archivo');
    }
    res.setHeader('Content-Type', archivo.mimetype);
    res.setHeader('Cache-Control', 'private, no-store');
    if (archivo.nombre_original) {
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${archivo.nombre_original.replace(/[^\w.\- ]+/g, '_')}"`,
      );
    }
    res.sendFile(rutaFisica);
  }
}

@Controller('almacenamiento')
@UseGuards(AuthGuard('jwt'))
export class AlmacenamientoController {
  constructor(private readonly almacenamiento: AlmacenamientoService) {}

  /** Uso actual del almacenamiento. Solo superadmin. */
  @Get('estado')
  async estado(@Req() req: any) {
    if (req.user?.rol !== 'superadmin') {
      throw new ForbiddenException('Solo el superadministrador puede ver el estado del almacenamiento');
    }
    return this.almacenamiento.uso(true);
  }
}
