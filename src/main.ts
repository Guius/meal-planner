import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
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
