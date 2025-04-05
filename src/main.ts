import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InternalServerErrorException } from '@nestjs/common';
import * as dotenv from 'dotenv';

async function bootstrap() {
  let currentEnvironment = process.env.NODE_ENV || 'local';
  currentEnvironment = currentEnvironment.trim().toLowerCase();

  const path = `.env.${currentEnvironment}`;
  const loadResult = dotenv.config({
    path: path,
  });
  if (loadResult.error) {
    throw new InternalServerErrorException(loadResult.error.message);
  }

  const app = await NestFactory.create(AppModule);
  const corsRegExp = new RegExp('http://localhost');
  //CORS enabled  which allows the neptuneweb to send requests and receive cookies
  app.enableCors({
    origin: corsRegExp,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
