import { INestApplication } from '@nestjs/common';
import {
    DocumentBuilder,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const isProd = process.env.NODE_ENV === 'production';

    const config = new DocumentBuilder()
        .setTitle('🏋️ Grippo API')
        .setDescription('📘 Full documentation for Grippo API endpoints.')
        .setVersion('1.0.0')
        .addServer('/', 'Local server')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                in: 'header',
                name: 'Authorization',
                description: 'Enter JWT token',
            },
            'access-token' // 👈 schema name
        )
        .build();

    const options: SwaggerDocumentOptions = {
        ignoreGlobalPrefix: false,
    };

    const doc = SwaggerModule.createDocument(app, config, options);

    doc.components ??= {};
    doc.components.parameters ??= {};
    doc.components.parameters.AcceptLanguage = {
        name: 'Accept-Language',
        in: 'header',
        description: 'Optional locale (en | ua | ru)',
        required: false,
        schema: {
            type: 'string',
            enum: ['en', 'ua', 'ru'],
        },
    };

    for (const pathItem of Object.values(doc.paths ?? {})) {
        if (!pathItem) continue;
        for (const method of Object.keys(pathItem)) {
            const operation: any = (pathItem as any)[method];
            if (!operation || typeof operation !== 'object') continue;
            operation.parameters ??= [];

            const alreadyPresent = operation.parameters.some(
                (param: any) => param?.['$ref'] === '#/components/parameters/AcceptLanguage',
            );
            if (!alreadyPresent) {
                operation.parameters.push({['$ref']: '#/components/parameters/AcceptLanguage'});
            }
        }
    }

    const customCss = `
    .swagger-ui .topbar {
      background-color: ${isProd ? '#ffffff' : '#1e293b'};
      border-bottom: 1px solid #ccc;
    }
    .topbar-wrapper img {
      content: url('https://img.icons8.com/color/48/gym.png');
      width: 40px;
      height: 40px;
    }
  `;

    SwaggerModule.setup('docs', app, doc, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            displayRequestDuration: true,
            deepLinking: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            tryItOutEnabled: true,
        },
        customSiteTitle: `📘 Grippo API Docs (${isProd ? 'PROD' : 'DEV'})`,
        customCss,
    });
}
