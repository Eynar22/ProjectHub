import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { AppModule } from './app.module';

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

  // Comprime las respuestas (los listados con base64 embebido pesan bastante en texto plano)
  app.use(compression());

  // Payload limit for JSON bodies that embed base64 files (imágenes comprimidas + 1 PDF de hasta 10MB)
  app.use(json({ limit: '20mb' }));

  // El body-parser rechaza el request antes de llegar a Nest, así que por defecto Express
  // respondería con HTML/texto plano en vez de JSON. Lo interceptamos para devolver un
  // mensaje claro que el frontend pueda mostrar al usuario.
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      return res.status(413).json({
        statusCode: 413,
        message: 'El archivo es demasiado grande. El tamaño máximo permitido por solicitud es de 20MB (por ejemplo, un PDF de hasta 10MB).',
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
    }),
  );

  // Global prefix for API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api`);
}
bootstrap();
