import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { json, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { AppModule } from './app.module';
import { ErroresBdFilter } from './common/filtros/errores-bd.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];

  // Enable CORS for the frontend (Vite runs on port 5173)
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Comprime las respuestas.
  app.use(compression());

  // Los archivos ya no viajan como base64 en el JSON: se suben por multipart a
  // /api/archivos y en el body solo van rutas cortas. 2 MB sobra.
  app.use(json({ limit: '2mb' }));

  // El body-parser rechaza el request antes de llegar a Nest, así que por defecto Express
  // respondería con HTML/texto plano en vez de JSON. Lo interceptamos para devolver un
  // mensaje claro que el frontend pueda mostrar al usuario.
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      return res.status(413).json({
        statusCode: 413,
        message: 'La solicitud es demasiado grande. Los archivos deben subirse por separado (imagen o PDF), no dentro del formulario.',
      });
    }
    next(err);
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      // Además de la lista de mensajes, devolvemos { campo: mensaje } para que
      // el frontend pueda marcar el campo exacto que está mal.
      exceptionFactory: (errores) => {
        const errors: Record<string, string> = {};
        for (const e of errores) {
          const msg = Object.values(e.constraints ?? {})[0];
          if (msg) errors[e.property] = msg;
        }
        return new BadRequestException({ statusCode: 400, message: Object.values(errors), errors });
      },
    }),
  );

  // Errores de base de datos (texto demasiado largo, duplicados...) -> 4xx legible.
  app.useGlobalFilters(new ErroresBdFilter());

  // Global prefix for API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api`);
}
bootstrap();
