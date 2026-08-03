require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { json } = require('express');
const { AppModule } = require('../backend/src/app.module');

let cachedServer = null;

module.exports = async function handler(req, res) {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors();
    app.use(json({ limit: '50mb' }));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  
  return cachedServer(req, res);
};
