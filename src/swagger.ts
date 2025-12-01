import {INestApplication} from '@nestjs/common';
import {DocumentBuilder, SwaggerDocumentOptions, SwaggerModule,} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const isProd = process.env.NODE_ENV === 'production';
    const swaggerUiPath = 'docs';
    const swaggerJsonPath = `/${swaggerUiPath}-json`;

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

    const jsonLinkScript = `
      window.addEventListener('load', () => {
        const topbar = document.querySelector('.topbar');
        if (!topbar || topbar.querySelector('.swagger-json-link')) {
          return;
        }
        const link = document.createElement('a');
        link.href = '${swaggerJsonPath}';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'swagger-json-link';
        link.textContent = 'Swagger JSON';
        topbar.appendChild(link);
      });
    `;

    const httpAdapter = app.getHttpAdapter();
    const httpServer = httpAdapter.getInstance();
    if (httpAdapter.getType() === 'fastify') {
        httpServer.get('/swagger-custom.js', (_req, reply) =>
            reply.type('application/javascript').send(jsonLinkScript),
        );
    } else {
        httpServer.get('/swagger-custom.js', (_req, res) =>
            res.type('application/javascript').send(jsonLinkScript),
        );
    }

    SwaggerModule.setup(swaggerUiPath, app, doc, {
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
        customJs: '/swagger-custom.js',
    });
}
