import {INestApplication} from '@nestjs/common';
import {DocumentBuilder, SwaggerDocumentOptions, SwaggerModule,} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const options: SwaggerDocumentOptions = {
        ignoreGlobalPrefix: false,
    };

    const config = new DocumentBuilder()
        .setTitle('🏋️ Grippo API')
        .setDescription('📘 Full documentation for Grippo API endpoints.')
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Enter JWT token',
                in: 'header',
            },
            'access-token'
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, options);

    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none', // 'list' | 'full' | 'none'
            displayRequestDuration: true,
            deepLinking: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'Grippo API Docs',
    });
}
