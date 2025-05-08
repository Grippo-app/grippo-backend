import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const option: SwaggerDocumentOptions = {
    ignoreGlobalPrefix: false,
  };
  const config = new DocumentBuilder()
    .setTitle('Grippo API')
    .setDescription(`Desc`)
    .setVersion('1.0')
    .addBearerAuth();

  const document = SwaggerModule.createDocument(app, config.build(), option);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    }});
}
