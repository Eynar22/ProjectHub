import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ProyectoModule } from './proyecto/proyecto.module';
import { ChatModule } from './chat/chat.module';
import { TareaModule } from './tarea/tarea.module';
import { RecursoModule } from './recurso/recurso.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Entities
import * as Entities from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'backend', 'uploads'),
      serveRoot: '/uploads',
      renderPath: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        console.log('🚀 Version: 1.0.2 - Initializing Database Connection...');
        
        const entities = Object.values(Entities).filter(e => typeof e === 'function');

        let isLocal = false;
        if (databaseUrl) {
          try {
            const url = new URL(databaseUrl);
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === 'postgres') {
              isLocal = true;
            }
          } catch (e) {}
        } else {
          const host = configService.get<string>('DB_HOST') || 'localhost';
          if (host === 'localhost' || host === '127.0.0.1' || host === 'postgres') {
            isLocal = true;
          }
        }

        const sslOptions = isLocal ? false : {
          rejectUnauthorized: false,
        };

        const commonOptions = {
          entities,
          synchronize: false,
          retryAttempts: 10, // More retries for cold starts
          retryDelay: 3000,
          keepConnectionAlive: true,
          ...(isLocal ? {} : {
            ssl: sslOptions,
            extra: {
              ssl: sslOptions,
            },
          }),
        };

        if (databaseUrl) {
          console.log('🌐 DATABASE_URL detected. Parsing connection parameters...');
          try {
            // Parse the URL to bypass driver strictness with URL strings
            const url = new URL(databaseUrl);
            return {
              type: 'postgres',
              host: url.hostname,
              port: parseInt(url.port || '5432'),
              username: url.username,
              password: url.password,
              database: url.pathname.split('/')[1],
              ...commonOptions,
            };
          } catch (e) {
            console.error('❌ Failed to parse DATABASE_URL, falling back to URL string.');
            return {
              type: 'postgres',
              url: databaseUrl,
              ...commonOptions,
            };
          }
        }

        console.log('🏠 No DATABASE_URL found, falling back to local config.');
        return {
          type: 'postgres',
          host: String(configService.get('DB_HOST') || 'localhost'),
          port: Number(configService.get('DB_PORT') || 5432),
          username: String(configService.get('DB_USERNAME') || 'postgres'),
          password: String(configService.get('DB_PASSWORD') || '1234'),
          database: String(configService.get('DB_DATABASE') || 'buscador'),
          ...commonOptions,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    EmpresaModule,
    UsuarioModule,
    ProyectoModule,
    ChatModule,
    TareaModule,
    RecursoModule,
  ],
})
export class AppModule {}
