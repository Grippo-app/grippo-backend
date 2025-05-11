import {INestApplication} from '@nestjs/common';
import {DocumentBuilder, SwaggerDocumentOptions, SwaggerModule,} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const swaggerConfig = new DocumentBuilder()
        .setTitle('🏋️ Grippo API')
        .setDescription('📘 Full documentation for Grippo API endpoints.')
        .setVersion('1.0.0')
        .addServer('/', 'Local server') // 👈 для отображения базового URL
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                in: 'header',
                name: 'Authorization',
                description: 'Enter JWT token',
            },
            'access-token'
        )
        .build();

    const documentOptions: SwaggerDocumentOptions = {
        ignoreGlobalPrefix: false,
    };

    const document = SwaggerModule.createDocument(app, swaggerConfig, documentOptions);

    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none', // list | full | none
            displayRequestDuration: true,
            deepLinking: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            tryItOutEnabled: true,
        },
        customSiteTitle: '📘 Grippo API Docs',
        customCss: `
      .topbar-wrapper img { content: url('https://img.icons8.com/color/48/gym.png'); width: 40px; height: 40px; }
      .swagger-ui .topbar { background-color: #1e293b; } 
    `,
    });
}