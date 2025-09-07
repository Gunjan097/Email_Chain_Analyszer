// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); 
  app.enableCors({
    origin: 'https://email-chain-analyszer.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT || 3000);
  console.log(`Backend listening on http://localhost:${process.env.PORT || 3000}/api`);
}
bootstrap();
