import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import helmet from 'helmet';
import { WsAdapter } from '@nestjs/platform-ws';


import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidUnknownValues: false,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
        .setTitle('Gamification Platform API')
      .setDescription('APIs de Projects, Players, Progression, Inventory')
        .setVersion('0.1.0')
      .addApiKey(
          { type: 'apiKey', name: 'x-tenant-id', in: 'header', description: 'Tenant ID (ex.: demo)' },
          'Tenant',
      )
        .addBearerAuth()
        .addServer('http://localhost:3000')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('v1/docs', app, document)

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}/v1`);
}
bootstrap();
